import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { LAB_ORIGINS } from '@oauth-lab/protocol';
import { loadLabClients } from '@oauth-lab/protocol/node';
import { auth } from './auth';
import { getLabEvents, labInspectorEnabled, traceMiddleware } from './lab-inspector';
import { SCOPE_CATALOG } from './scope-catalog';

export const app = new Hono();

app.use('*', traceMiddleware);
app.use(
  '/api/auth/*',
  cors({
    origin: [LAB_ORIGINS.authorizationServer, LAB_ORIGINS.publicClient, LAB_ORIGINS.bffClient],
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization', 'DPoP', 'X-Trace-Id'],
    exposeHeaders: ['X-Trace-Id', 'DPoP-Nonce'],
  }),
);

app.get('/health', (context) => context.json({ status: 'ok', role: 'authorization-server' }));
app.all('/api/auth/*', (context) => auth.handler(context.req.raw));
app.all('/.well-known/*', (context) => auth.handler(context.req.raw));

if (process.env.OAUTH_LAB_MODE === 'true') {
  app.get('/lab/scope-catalog', (context) => {
    if (!labInspectorEnabled(context.req.url)) return context.notFound();
    return context.json(SCOPE_CATALOG);
  });
  app.get('/lab/client-config', async (context) => {
    if (!labInspectorEnabled(context.req.url)) return context.notFound();
    const clients = await loadLabClients();
    return context.json({
      publicClientId: clients.publicClient.clientId,
      deviceClientId: clients.deviceCli.clientId,
    });
  });
  app.get('/lab/events', (context) => {
    if (!labInspectorEnabled(context.req.url)) return context.notFound();
    return context.json({ events: getLabEvents() });
  });
}

app.notFound((context) => context.json({ error: 'not_found' }, 404));
