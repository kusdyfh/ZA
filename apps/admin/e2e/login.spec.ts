import { expect, test } from '@playwright/test';
import { E2E_ADMIN_EMAIL, loginAsAdmin } from './helpers';

// This spec exercises the actual login flow, so it deliberately starts
// from a signed-out browser context rather than the shared authenticated
// storageState every other spec reuses (playwright.config.ts).
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  test('redirects an unauthenticated visitor to /login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('/login');
  });

  test('rejects the wrong password with an inline error, not a redirect', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(E2E_ADMIN_EMAIL);
    await page.getByLabel('Password').fill('definitely-wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  test('logs in, lands on the dashboard, and survives a reload', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Total orders')).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});
