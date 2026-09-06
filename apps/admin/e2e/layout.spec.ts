import { expect, test } from '@playwright/test';

test.describe('Responsive layout and dark mode', () => {
  test('collapses the sidebar into a hamburger menu on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Products' })).toBeHidden();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
    await page.getByRole('button', { name: 'Close menu' }).click();
    await expect(page.getByRole('link', { name: 'Products' })).toBeHidden();
  });

  test('shows the full sidebar on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
  });

  test('toggles dark mode and it persists across navigation', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).not.toHaveAttribute('data-theme', 'dark');

    await page.getByRole('button', { name: /switch to dark mode/i }).click();
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Scoped to the nav — the dashboard's "Total orders"/"Pending orders"
    // stat cards also link to /orders and would otherwise collide.
    await page.getByRole('navigation').getByRole('link', { name: 'Orders' }).click();
    await expect(page).toHaveURL('/orders');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    await page.getByRole('button', { name: /switch to light mode/i }).click();
    await expect(html).not.toHaveAttribute('data-theme', 'dark');
  });
});
