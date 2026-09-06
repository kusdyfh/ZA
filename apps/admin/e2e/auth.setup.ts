import { test as setup } from '@playwright/test';
import { loginAsAdmin } from './helpers';

const AUTH_FILE = 'e2e/.auth/admin.json';

/**
 * Logs in once and persists the localStorage-held token (ADR 0019 §2)
 * as Playwright storage state, so every other spec reuses the session
 * instead of hitting `/auth/login` again — staff login is rate-limited
 * to 5 requests/60s per IP (ADR 0017 §6), the same constraint every
 * prior epic's integration suite had to budget around.
 */
setup('authenticate as the seeded admin', async ({ page }) => {
  await loginAsAdmin(page);
  await page.context().storageState({ path: AUTH_FILE });
});
