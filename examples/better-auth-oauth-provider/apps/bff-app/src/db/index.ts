import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { loadLabEnv, requireEnv } from '@oauth-lab/protocol/node';
import * as schema from './schema';

loadLabEnv();

export const pool = new Pool({ connectionString: requireEnv('BFF_DATABASE_URL') });
export const db = drizzle(pool, { schema });
