import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LabClientConfig } from './constants';

export const LAB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const LAB_ENV_PATH = resolve(LAB_ROOT, '.local/.env');
export const LAB_CLIENTS_PATH = resolve(LAB_ROOT, '.local/clients.json');

export function loadLabEnv(): void {
  process.loadEnvFile(LAB_ENV_PATH);
}

export async function loadLabClients(): Promise<LabClientConfig> {
  return JSON.parse(await readFile(LAB_CLIENTS_PATH, 'utf8')) as LabClientConfig;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required. Run pnpm setup first.`);
  return value;
}

export function isLoopbackHostname(hostname: string): boolean {
  return hostname === '127.0.0.1' || hostname === '127.0.0.2' || hostname === '127.0.0.3' || hostname === '127.0.0.4' || hostname === 'localhost';
}
