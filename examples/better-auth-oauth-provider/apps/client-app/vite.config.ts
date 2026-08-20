import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { LabClientConfig } from '@oauth-lab/protocol';

export default defineConfig(() => {
  const clients = JSON.parse(
    readFileSync(resolve(import.meta.dirname, '../../.local/clients.json'), 'utf8'),
  ) as LabClientConfig;

  return {
    plugins: [react()],
    define: {
      __PUBLIC_CLIENT_ID__: JSON.stringify(clients.publicClient.clientId),
    },
    server: { host: '127.0.0.1', port: 4200, strictPort: true },
  };
});
