import { serve } from '@hono/node-server';
import { LAB_ORIGINS } from '@oauth-lab/protocol';
import { loadLabEnv } from '@oauth-lab/protocol/node';
import { app } from './app';

loadLabEnv();

const url = new URL(LAB_ORIGINS.resourceApi);
serve({ fetch: app.fetch, hostname: url.hostname, port: Number(url.port) }, (info) => {
  console.log(`Resource API: http://${info.address}:${info.port}`);
});
