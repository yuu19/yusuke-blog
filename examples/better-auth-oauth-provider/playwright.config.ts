import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

process.loadEnvFile(resolve(import.meta.dirname, '.local/.env'));

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  outputDir: '/tmp/oauth-lab-playwright-results',
  use: {
    // OAuth response bodies contain live local credentials. Keep browser traces
    // off so a negative test cannot persist them in an artifact.
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm run lab:dev',
      url: 'http://127.0.0.1:4200',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter @oauth-lab/bff-app dev',
      url: 'http://[::1]:4400',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
