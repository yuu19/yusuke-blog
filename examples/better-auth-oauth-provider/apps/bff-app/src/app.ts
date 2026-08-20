import { Hono, type Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { and, eq, gt } from 'drizzle-orm';
import {
  assertIssuer,
  AUTH_ISSUER,
  createDpopKey,
  createDpopProof,
  createPkce,
  importDpopKey,
  LAB_ORIGINS,
  NOTES_RESOURCE,
  randomBase64Url,
  readOAuthResponse,
  SCOPES,
  summarizeSecret,
  validateIdToken,
  type OAuthTokenResponse,
} from '@oauth-lab/protocol';
import type { JWK } from 'jose';
import { loadLabClients } from '@oauth-lab/protocol/node';
import { hashIdentifier, open, randomOpaqueId, seal } from './crypto';
import { db } from './db';
import { oauthSessions, oauthTransactions } from './db/schema';

const sessionCookie = 'oauth_lab_bff';
const transactionCookie = 'oauth_lab_bff_tx';
const cookieOptions = {
  httpOnly: true,
  sameSite: 'Lax' as const,
  secure: false,
  path: '/',
};

type StoredTokenSet = OAuthTokenResponse & {
  obtainedAt: number;
  dpopKey?: { privateJwk: JWK; publicJwk: JWK };
};

function basicCredentials(clientId: string, clientSecret: string): string {
  const encodedId = encodeURIComponent(clientId);
  const encodedSecret = encodeURIComponent(clientSecret);
  return `Basic ${Buffer.from(`${encodedId}:${encodedSecret}`, 'utf8').toString('base64')}`;
}

async function sessionFrom(context: Context) {
  const sessionId = getCookie(context, sessionCookie);
  if (!sessionId) return undefined;
  const [record] = await db.select().from(oauthSessions).where(and(
    eq(oauthSessions.sessionIdHash, hashIdentifier(sessionId)),
    gt(oauthSessions.expiresAt, new Date()),
  ));
  if (!record) return undefined;
  return { record, tokens: await open<StoredTokenSet>(record.tokenCiphertext) };
}

async function proxyNotes(context: Context, method: 'GET' | 'POST') {
  const session = await sessionFrom(context);
  if (!session) return context.json({ error: 'login_required' }, 401);
  const url = `${NOTES_RESOURCE}/notes`;
  const requestBody = method === 'POST' ? JSON.stringify(await context.req.json()) : undefined;
  const dpopKey = session.tokens.dpopKey
    ? await importDpopKey(session.tokens.dpopKey.privateJwk, session.tokens.dpopKey.publicJwk)
    : undefined;

  async function send(nonce?: string) {
    const proof = dpopKey
      ? await createDpopProof({
          key: dpopKey,
          method,
          url,
          accessToken: session!.tokens.access_token,
          nonce,
        })
      : undefined;
    return fetch(url, {
      method,
      headers: {
        authorization: `${proof ? 'DPoP' : 'Bearer'} ${session!.tokens.access_token}`,
        'content-type': 'application/json',
        ...(proof ? { dpop: proof } : {}),
      },
      body: requestBody,
    });
  }

  let upstream = await send();
  const dpopNonce = upstream.headers.get('dpop-nonce');
  if (dpopKey && upstream.status === 401 && dpopNonce) upstream = await send(dpopNonce);
  return new Response(upstream.body, { status: upstream.status, headers: upstream.headers });
}

export const app = new Hono();

app.get('/api/bff/session', async (context) => {
  const session = await sessionFrom(context);
  if (!session) return context.json({ authenticated: false });
  return context.json({
    authenticated: true,
    subject: session.record.subject,
    accessToken: await summarizeSecret('server-side-access-token', session.tokens.access_token),
    browserReceivesOAuthToken: false,
    tokenType: session.tokens.token_type,
  });
});

app.get('/api/bff/login', async (context) => {
  const clients = await loadLabClients();
  const { verifier, challenge } = await createPkce();
  const state = randomBase64Url(32);
  const nonce = randomBase64Url(32);
  const browserBinding = randomOpaqueId();
  const dpopKey = context.req.query('dpop') === '1' ? await createDpopKey() : undefined;
  await db.insert(oauthTransactions).values({
    stateHash: hashIdentifier(state),
    browserBindingHash: hashIdentifier(browserBinding),
    codeVerifier: verifier,
    nonce,
    dpopJkt: dpopKey?.thumbprint,
    dpopKeyCiphertext: dpopKey
      ? await seal({ privateJwk: dpopKey.privateJwk, publicJwk: dpopKey.publicJwk })
      : null,
  });
  setCookie(context, transactionCookie, browserBinding, { ...cookieOptions, maxAge: 600 });

  const url = new URL(`${AUTH_ISSUER}/oauth2/authorize`);
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: clients.bff.clientId,
    redirect_uri: `${LAB_ORIGINS.bffClient}/api/bff/callback`,
    scope: [SCOPES.openid, SCOPES.profile, SCOPES.email, SCOPES.notesRead, SCOPES.notesWrite, SCOPES.offlineAccess].join(' '),
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    resource: NOTES_RESOURCE,
    ...(dpopKey ? { dpop_jkt: dpopKey.thumbprint } : {}),
  }).toString();
  return context.redirect(url.toString());
});

app.get('/api/bff/callback', async (context) => {
  const state = context.req.query('state');
  const code = context.req.query('code');
  const browserBinding = getCookie(context, transactionCookie);
  if (!state || !code || !browserBinding) return context.json({ error: 'invalid_callback' }, 400);
  assertIssuer(context.req.query('iss') ?? null, AUTH_ISSUER);

  const [transaction] = await db.select().from(oauthTransactions).where(and(
    eq(oauthTransactions.stateHash, hashIdentifier(state)),
    eq(oauthTransactions.browserBindingHash, hashIdentifier(browserBinding)),
    gt(oauthTransactions.createdAt, new Date(Date.now() - 10 * 60 * 1000)),
  ));
  await db.delete(oauthTransactions).where(eq(oauthTransactions.stateHash, hashIdentifier(state)));
  deleteCookie(context, transactionCookie, { path: '/' });
  if (!transaction) return context.json({ error: 'invalid_or_consumed_state' }, 400);

  const clients = await loadLabClients();
  const storedDpopKey = transaction.dpopKeyCiphertext
    ? await open<{ privateJwk: JWK; publicJwk: JWK }>(transaction.dpopKeyCiphertext)
    : undefined;
  const dpopKey = storedDpopKey
    ? await importDpopKey(storedDpopKey.privateJwk, storedDpopKey.publicJwk)
    : undefined;
  const tokenEndpoint = `${AUTH_ISSUER}/oauth2/token`;
  const response = await fetch(`${AUTH_ISSUER}/oauth2/token`, {
    method: 'POST',
    headers: {
      authorization: basicCredentials(clients.bff.clientId, clients.bff.clientSecret),
      'content-type': 'application/x-www-form-urlencoded',
      ...(dpopKey ? { dpop: await createDpopProof({ key: dpopKey, method: 'POST', url: tokenEndpoint }) } : {}),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${LAB_ORIGINS.bffClient}/api/bff/callback`,
      code_verifier: transaction.codeVerifier,
      resource: NOTES_RESOURCE,
    }),
  });
  const tokens = await readOAuthResponse(response);
  if (!tokens.id_token) return context.json({ error: 'id_token_missing' }, 502);
  const claims = await validateIdToken({
    idToken: tokens.id_token,
    accessToken: tokens.access_token,
    issuer: AUTH_ISSUER,
    clientId: clients.bff.clientId,
    nonce: transaction.nonce,
  });

  const sessionId = randomOpaqueId();
  await db.insert(oauthSessions).values({
    sessionIdHash: hashIdentifier(sessionId),
    tokenCiphertext: await seal({
      ...tokens,
      obtainedAt: Date.now(),
      ...(storedDpopKey ? { dpopKey: storedDpopKey } : {}),
    }),
    subject: claims.sub,
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
  });
  setCookie(context, sessionCookie, sessionId, { ...cookieOptions, maxAge: 8 * 60 * 60 });
  return context.redirect(LAB_ORIGINS.bffClient);
});

app.get('/api/bff/notes', (context) => proxyNotes(context, 'GET'));
app.post('/api/bff/notes', (context) => proxyNotes(context, 'POST'));

app.post('/api/bff/logout', async (context) => {
  const sessionId = getCookie(context, sessionCookie);
  if (sessionId) {
    await db.delete(oauthSessions).where(eq(oauthSessions.sessionIdHash, hashIdentifier(sessionId)));
  }
  deleteCookie(context, sessionCookie, { path: '/' });
  return context.json({ loggedOut: true });
});
