import { expect, test } from '@playwright/test';

test.describe('Orders', () => {
  test('lists the seeded demo order and opens its detail page', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();

    const firstOrderLink = page.locator('table tbody tr').first().getByRole('button');
    await expect(firstOrderLink).toBeVisible();
    await firstOrderLink.click();

    await expect(page.getByRole('heading', { name: /^Order / })).toBeVisible();
    await expect(page.getByText('Items').first()).toBeVisible();
    await expect(page.getByText('Status history', { exact: true })).toBeVisible();
  });

  test('adds a note to an order', async ({ page }) => {
    await page.goto('/orders');
    await page.locator('table tbody tr').first().getByRole('button').click();

    const noteBody = `E2E note ${Date.now()}`;
    await page.getByRole('button', { name: 'Add note' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add a note' });
    await dialog.getByLabel('Note', { exact: true }).fill(noteBody);
    await dialog.getByRole('button', { name: 'Add note' }).click();
    await expect(dialog).not.toBeVisible();

    await expect(page.getByText(noteBody)).toBeVisible();
  });
});
