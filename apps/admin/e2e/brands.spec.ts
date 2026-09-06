import { expect, test } from '@playwright/test';

test.describe('Brands', () => {
  test('creates, edits, and deletes a brand', async ({ page }) => {
    const brandName = `E2E Brand ${Date.now()}`;
    const updatedName = `${brandName} (updated)`;

    await page.goto('/brands');
    await expect(page.getByRole('heading', { name: 'Brands' })).toBeVisible();

    await page.getByRole('button', { name: 'Add brand' }).click();
    const createDialog = page.getByRole('dialog', { name: 'Add brand' });
    await createDialog.getByLabel('Name').fill(brandName);
    await createDialog.getByRole('button', { name: 'Save' }).click();
    await expect(createDialog).not.toBeVisible();
    await expect(page.getByRole('cell', { name: brandName, exact: true })).toBeVisible();

    await page.getByRole('button', { name: `Edit ${brandName}` }).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit brand' });
    await editDialog.getByLabel('Name').fill(updatedName);
    await editDialog.getByRole('button', { name: 'Save' }).click();
    await expect(editDialog).not.toBeVisible();
    await expect(page.getByRole('cell', { name: updatedName, exact: true })).toBeVisible();

    await page.getByRole('button', { name: `Delete ${updatedName}` }).click();
    const confirmDialog = page.getByRole('dialog', { name: 'Delete brand' });
    await confirmDialog.getByRole('button', { name: 'Delete' }).click();
    await expect(confirmDialog).not.toBeVisible();
    await expect(page.getByRole('cell', { name: updatedName, exact: true })).not.toBeVisible();
  });
});
