import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const internalServer = 'http://127.0.0.1:4110';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 4100,
    strictPort: true,
    proxy: {
      '/api/auth': { target: internalServer, changeOrigin: false },
      '/.well-known': { target: internalServer, changeOrigin: false },
      '/lab': { target: internalServer, changeOrigin: false },
    },
  },
});
