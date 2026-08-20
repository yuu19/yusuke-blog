import { defineConfig } from 'drizzle-kit';
import { loadLabEnv, requireEnv } from '@oauth-lab/protocol/node';

loadLabEnv();

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: requireEnv('NOTES_DATABASE_URL') },
});
