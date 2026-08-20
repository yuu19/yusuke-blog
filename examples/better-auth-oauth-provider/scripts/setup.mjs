import { randomBytes } from 'node:crypto';
import { mkdir, open, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const localDirectory = resolve(rootDirectory, '.local');
const envPath = resolve(localDirectory, '.env');

function secret(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

async function fileExists(path) {
  try {
    const handle = await open(path, 'r');
    await handle.close();
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

await mkdir(localDirectory, { recursive: true, mode: 0o700 });

if (await fileExists(envPath)) {
  console.log(`既存の ${envPath} は上書きしません。`);
  process.exit(0);
}

const postgresPassword = secret(24);
const authPassword = secret(24);
const notesPassword = secret(24);
const bffPassword = secret(24);
const bootstrapPassword = secret(18);
const lines = [
  `POSTGRES_PASSWORD=${postgresPassword}`,
  `AUTH_DB_PASSWORD=${authPassword}`,
  `NOTES_DB_PASSWORD=${notesPassword}`,
  `BFF_DB_PASSWORD=${bffPassword}`,
  `AUTH_DATABASE_URL=postgresql://oauth_auth:${authPassword}@127.0.0.1:55432/oauth_auth`,
  `NOTES_DATABASE_URL=postgresql://oauth_notes:${notesPassword}@127.0.0.1:55432/oauth_notes`,
  `BFF_DATABASE_URL=postgresql://oauth_bff:${bffPassword}@127.0.0.1:55432/oauth_bff`,
  `BETTER_AUTH_SECRET=${secret(48)}`,
  `BFF_TOKEN_ENCRYPTION_KEY=${secret(32)}`,
  'BETTER_AUTH_URL=http://localhost:4100',
  'AUTH_INTERNAL_URL=http://127.0.0.1:4110',
  'CLIENT_APP_URL=http://127.0.0.1:4200',
  'RESOURCE_API_URL=http://127.0.0.3:4300',
  'BFF_APP_URL=http://[::1]:4400',
  'OAUTH_LAB_MODE=true',
  'OAUTH_LAB_BOOTSTRAP_EMAIL=reader@example.test',
  `OAUTH_LAB_BOOTSTRAP_PASSWORD=${bootstrapPassword}`,
];

await writeFile(envPath, `${lines.join('\n')}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
console.log(`ローカル専用設定を ${envPath} に作成しました。値は表示していません。`);
