import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Browsing', () => {
  test('shows featured products on the homepage and links to a product detail page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Classic V-Neck Scrub Top/ }).first()).toBeVisible();

    await page.getByRole('link', { name: /Classic V-Neck Scrub Top/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Classic V-Neck Scrub Top' })).toBeVisible();
  });

  test('searches the catalog from the shop page', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.getByRole('heading', { name: 'Shop' })).toBeVisible();

    await page.getByLabel('Search products').fill('Scrub Pants');
    await page.getByLabel('Search products').press('Enter');

    await expect(page.getByText('Relaxed Fit Scrub Pants')).toBeVisible();
  });

  test('browses a category and opens a product from it', async ({ page }) => {
    await page.goto('/categories');
    await page.getByRole('link', { name: 'Bottoms' }).click();

    await expect(page.getByRole('heading', { name: 'Bottoms' })).toBeVisible();
    await page.getByText('Relaxed Fit Scrub Pants').click();
    await expect(page.getByRole('heading', { name: 'Relaxed Fit Scrub Pants' })).toBeVisible();
  });
});
