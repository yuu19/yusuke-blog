import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const appDirectory = dirname(fileURLToPath(import.meta.url));
const labDirectory = resolve(appDirectory, '../..');
process.loadEnvFile(resolve(labDirectory, '.local/.env'));

const children = [
  spawn('pnpm', ['dev:server'], { cwd: appDirectory, env: process.env, stdio: 'inherit' }),
  spawn('pnpm', ['dev:ui'], { cwd: appDirectory, env: process.env, stdio: 'inherit' }),
];

let shuttingDown = false;
function shutdown(signal = 'SIGTERM') {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill(signal);
}

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => shutdown(signal));
for (const child of children) {
  child.on('exit', (code) => {
    shutdown();
    process.exitCode = code ?? 0;
  });
}
