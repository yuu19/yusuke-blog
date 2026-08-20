import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { count, eq } from 'drizzle-orm';
import {
  AUTH_ISSUER,
  createTraceId,
  LAB_ORIGINS,
  NOTES_RESOURCE,
  SCOPES,
} from '@oauth-lab/protocol';
import { db } from './db';
import { notes } from './db/schema';
import { challengeFor, verifyRequest } from './token-verifier';

type VerifiedPrincipal = {
  subject: string;
  clientId?: string;
};

export const app = new Hono();

app.use(
  '*',
  cors({
    origin: [LAB_ORIGINS.publicClient, LAB_ORIGINS.bffClient],
    allowHeaders: ['Authorization', 'Content-Type', 'DPoP', 'X-Trace-Id'],
    exposeHeaders: ['WWW-Authenticate', 'X-Trace-Id', 'DPoP-Nonce'],
  }),
);
app.use('*', async (context, next) => {
  context.header('x-trace-id', context.req.header('x-trace-id') ?? createTraceId());
  await next();
});

app.get('/health', (context) => context.json({ status: 'ok', role: 'resource-api' }));
app.get('/.well-known/oauth-protected-resource', (context) => context.json({
  resource: NOTES_RESOURCE,
  authorization_servers: [AUTH_ISSUER],
  scopes_supported: [SCOPES.notesRead, SCOPES.notesWrite, SCOPES.notesIndex],
  bearer_methods_supported: ['header'],
  dpop_signing_alg_values_supported: ['ES256'],
}));

async function principal(context: Context, requiredScopes: string[]): Promise<VerifiedPrincipal | Response> {
  try {
    const claims = await verifyRequest(context.req.raw, requiredScopes);
    const subject = typeof claims.sub === 'string'
      ? claims.sub
      : typeof claims.client_id === 'string'
        ? claims.client_id
        : typeof claims.azp === 'string'
          ? claims.azp
          : undefined;
    if (!subject) return context.json({ error: 'invalid_token', error_description: 'subject is missing' }, 401);
    return {
      subject,
      clientId: typeof claims.client_id === 'string' ? claims.client_id : undefined,
    };
  } catch (error) {
    const challenge = challengeFor(error, requiredScopes);
    if (challenge) {
      const headers = new Headers(challenge.headers);
      for (const [name, value] of headers) context.header(name, value);
      return context.json(
        { error: challenge.statusCode === 403 ? 'insufficient_scope' : 'invalid_token' },
        challenge.statusCode as 401 | 403,
      );
    }
    console.error('Token verification failed without an OAuth challenge', error);
    return context.json({ error: 'server_error' }, 500);
  }
}

app.get('/notes', async (context) => {
  const verified = await principal(context, [SCOPES.notesRead]);
  if (verified instanceof Response) return verified;
  const rows = await db.select().from(notes).where(eq(notes.ownerSubject, verified.subject));
  return context.json({ notes: rows });
});

app.post('/notes', async (context) => {
  const verified = await principal(context, [SCOPES.notesWrite]);
  if (verified instanceof Response) return verified;
  const input = await context.req.json<{ title?: unknown; body?: unknown }>();
  if (typeof input.title !== 'string' || typeof input.body !== 'string') {
    return context.json({ error: 'invalid_request' }, 400);
  }
  const [note] = await db.insert(notes).values({
    id: crypto.randomUUID(),
    ownerSubject: verified.subject,
    title: input.title,
    body: input.body,
  }).returning();
  return context.json({ note }, 201);
});

app.post('/index', async (context) => {
  const verified = await principal(context, [SCOPES.notesIndex]);
  if (verified instanceof Response) return verified;
  if (!verified.clientId) return context.json({ error: 'service_principal_required' }, 403);
  const [result] = await db.select({ value: count() }).from(notes);
  return context.json({ indexedBy: verified.clientId, noteCount: result?.value ?? 0 });
});
