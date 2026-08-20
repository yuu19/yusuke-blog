import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(rootDirectory, '.local/.env');

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: rootDirectory,
      env: process.env,
      stdio: 'inherit',
      ...options,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

if (Number(process.versions.node.split('.')[0]) < 22) {
  throw new Error('Node.js 22以上が必要です。');
}
if (!existsSync(envPath)) {
  throw new Error('先に pnpm setup を実行してください。');
}

process.loadEnvFile(envPath);
await run('docker', ['compose', '--env-file', envPath, 'up', '-d', '--wait', 'postgres']);
await run('pnpm', ['db:migrate']);
await run('pnpm', ['seed']);

console.log('OAuth labを起動します。終了するにはCtrl+Cを押してください。');
const child = spawn(
  'pnpm',
  [
    '--parallel',
    '--filter',
    '@oauth-lab/auth-server',
    '--filter',
    '@oauth-lab/client-app',
    '--filter',
    '@oauth-lab/resource-api',
    'dev',
  ],
  { cwd: rootDirectory, env: process.env, stdio: 'inherit' },
);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

child.on('exit', (code) => process.exit(code ?? 0));
