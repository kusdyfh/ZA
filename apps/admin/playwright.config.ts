import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.E2E_PORT ?? '3011';
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Critical-flow E2E tests, per ADR 0019 §8. These need the real stack
 * up — `apps/api` running against a real, seeded Postgres (the same
 * precondition every prior epic's `test:integration` already carries) —
 * so this is NOT part of `turbo run test`; run explicitly with
 * `pnpm --filter @za/admin test:e2e` once the API is reachable at
 * NEXT_PUBLIC_API_URL and an admin (E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD,
 * defaulting to the seeded bootstrap Super Admin) can log in.
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
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/admin.json' },
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
