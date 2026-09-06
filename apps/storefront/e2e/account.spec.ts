import { expect, test } from '@playwright/test';

test.describe('Customer account', () => {
  test('shows the signed-in account page with profile details', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'My account' })).toBeVisible();
    await expect(page.getByLabel('First name')).toHaveValue('E2E');
  });

  test('adds a product to the wishlist from its detail page and finds it under My account', async ({ page }) => {
    await page.goto('/products/relaxed-fit-scrub-pants');
    await page.getByRole('button', { name: 'Add Relaxed Fit Scrub Pants to wishlist' }).click();
    await expect(page.getByRole('button', { name: 'Remove Relaxed Fit Scrub Pants from wishlist' })).toBeVisible();

    await page.goto('/account/wishlist');
    await expect(page.getByRole('heading', { name: 'Wishlist' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Relaxed Fit Scrub Pants' })).toBeVisible();

    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByText('Your wishlist is empty')).toBeVisible();
  });

  test('shows an empty order history for a customer who has not ordered yet', async ({ page }) => {
    await page.goto('/account/orders');
    await expect(page.getByRole('heading', { name: 'Order history' })).toBeVisible();
  });
});
