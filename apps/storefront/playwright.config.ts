import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.E2E_PORT ?? '3010';
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Critical-flow E2E tests, per ADR 0022 §9. These need the real stack
 * up — `apps/api` running against a real, seeded Postgres — so this is
 * NOT part of `turbo run test`; run explicitly with
 * `pnpm --filter @za/storefront test:e2e` once the API is reachable at
 * NEXT_PUBLIC_API_URL. The auth-setup project registers/logs in a
 * throwaway customer (E2E_CUSTOMER_EMAIL/PASSWORD) once and shares its
 * session across specs.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts$/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/customer.json' },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts$/,
    },
  ],
  webServer: {
    command: `next build && next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { PORT },
  },
});
