import { expect, test } from '@playwright/test';

test.describe('Inventory', () => {
  test('lists the seeded default warehouse and switches tabs', async ({ page }) => {
    await page.goto('/inventory');
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Default' }).first()).toBeVisible();

    await page.getByRole('tab', { name: 'Low Stock' }).click();
    await expect(page.getByRole('tab', { name: 'Low Stock', selected: true })).toBeVisible();

    await page.getByRole('tab', { name: 'Reservations' }).click();
    await expect(page.getByText(/no "list all reservations" endpoint/i)).toBeVisible();
  });
});
