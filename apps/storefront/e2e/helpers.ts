import type { Page } from '@playwright/test';

export const E2E_CUSTOMER_EMAIL = process.env.E2E_CUSTOMER_EMAIL ?? 'e2e-customer@za-store.test';
export const E2E_CUSTOMER_PASSWORD = process.env.E2E_CUSTOMER_PASSWORD ?? 'E2ECustomerPassword1234';

/**
 * Unlike the admin app's seeded admin account, this customer is a
 * throwaway created by the test run itself — so the first run registers
 * it, and every subsequent run (the DB already has it) falls back to
 * signing in once registration reports the email is taken.
 */
export async function registerOrLoginCustomer(page: Page): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('First name').fill('E2E');
  await page.getByLabel('Last name').fill('Customer');
  await page.getByLabel('Email', { exact: true }).fill(E2E_CUSTOMER_EMAIL);
  await page.getByLabel('Password').fill(E2E_CUSTOMER_PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();

  const accountHeading = page.getByRole('heading', { name: 'My account' });
  // Scoped to the form's own error paragraph — a plain getByRole('alert')
  // also matches Next.js's invisible route-announcer div (id
  // "__next-route-announcer__"), which is a role="alert" live region that
  // exists on every page and causes a strict-mode violation here.
  const registerError = page.locator('p[role="alert"]');
  await Promise.race([accountHeading.waitFor(), registerError.waitFor()]);

  if (await accountHeading.isVisible()) {
    return;
  }

  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(E2E_CUSTOMER_EMAIL);
  await page.getByLabel('Password').fill(E2E_CUSTOMER_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/account');
  await accountHeading.waitFor();
}

/** Selects the seeded Classic V-Neck Scrub Top's only Navy Blue / M variant and adds it to the cart. */
export async function addSeededProductToCart(page: Page): Promise<void> {
  await page.goto('/products/classic-v-neck-scrub-top');
  await page.getByRole('radio', { name: 'Navy Blue' }).click();
  await page.getByRole('radio', { name: 'M' }).click();
  await page.getByRole('button', { name: 'Add to cart' }).click();
}
