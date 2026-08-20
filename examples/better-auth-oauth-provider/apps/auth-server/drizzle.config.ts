import { defineConfig } from 'drizzle-kit';
import { loadLabEnv, requireEnv } from '@oauth-lab/protocol/node';

loadLabEnv();

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: requireEnv('AUTH_DATABASE_URL') },
});
