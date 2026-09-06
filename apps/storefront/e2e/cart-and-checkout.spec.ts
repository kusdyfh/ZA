import { expect, test } from '@playwright/test';
import { addSeededProductToCart } from './helpers';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Guest cart and checkout', () => {
  test('adds a variant to the cart and sees it reflected on the cart page', async ({ page }) => {
    await addSeededProductToCart(page);

    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: 'Your cart' })).toBeVisible();
    await expect(page.getByText('Classic V-Neck Scrub Top')).toBeVisible();
  });

  test('updates line item quantity and removes it, leaving the cart empty', async ({ page }) => {
    await addSeededProductToCart(page);
    await page.goto('/cart');

    await page.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(page.getByRole('group', { name: 'Quantity' }).getByText('2', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Remove Classic V-Neck Scrub Top' }).click();
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  test('completes guest checkout and lands on the order confirmation page', async ({ page }) => {
    await addSeededProductToCart(page);
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();

    await page.getByLabel('Full name').first().fill('Jane Guest');
    await page.getByLabel('Email').fill('jane.guest@example.com');
    await page.getByLabel('Phone').first().fill('07701234567');

    await page.getByLabel('Full name').nth(1).fill('Jane Guest');
    await page.getByLabel('Phone').nth(1).fill('07701234567');
    await page.getByLabel('Address line 1').fill('123 Karrada Street');
    await page.getByLabel('City').fill('Baghdad');
    await page.getByLabel('Governorate').fill('Baghdad');
    await page.getByLabel('Delivery method').selectOption({ label: 'Standard Delivery (2-5 business days)' });

    await page.getByRole('button', { name: 'Place order' }).click();

    await expect(page).toHaveURL(/\/checkout\/confirmation\//);
    await expect(page.getByRole('heading', { name: 'Thank you for your order!' })).toBeVisible();
  });
});
