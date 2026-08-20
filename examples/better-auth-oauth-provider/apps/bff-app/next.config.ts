import type { NextConfig } from 'next';
import { resolve } from 'node:path';

const config: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: resolve(process.cwd(), '../..'),
  allowedDevOrigins: ['[::1]'],
};

export default config;
