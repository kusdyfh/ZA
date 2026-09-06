import { expect, test } from '@playwright/test';

test.describe('Products', () => {
  test('searches the seeded catalog and opens a product detail page', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();

    await page.getByLabel('Search products').fill('Scrub Pants');
    await expect(page.getByText('Relaxed Fit Scrub Pants')).toBeVisible();

    await page.getByText('Relaxed Fit Scrub Pants').click();
    await expect(page.getByRole('heading', { name: 'Relaxed Fit Scrub Pants' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Variants' })).toBeVisible();

    await page.getByRole('tab', { name: 'Variants' }).click();
    await expect(page.getByRole('tab', { name: 'Variants', selected: true })).toBeVisible();
  });

  test('creates a new product', async ({ page }) => {
    const productName = `E2E Product ${Date.now()}`;

    await page.goto('/products/new');
    await page.getByLabel('Name').fill(productName);
    await page.getByLabel('SKU').fill(`E2E-${Date.now()}`);
    await page.getByLabel('Price', { exact: true }).fill('49.99');
    await page.getByLabel('Category').selectOption({ label: 'Bottoms' });
    await page.getByRole('button', { name: 'Create product' }).click();

    await expect(page.getByRole('heading', { name: productName })).toBeVisible();
  });
});
