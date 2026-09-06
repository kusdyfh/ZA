import { expect, test } from '@playwright/test';

test.describe('Roles, Permissions, and Staff', () => {
  test('views a role’s permission set', async ({ page }) => {
    await page.goto('/roles');
    await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible();

    await page.getByRole('cell', { name: 'Super Admin' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('products.manage')).toBeVisible();
  });

  test('lists the full permission catalog', async ({ page }) => {
    await page.goto('/permissions');
    await expect(page.getByRole('heading', { name: 'Permissions' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'products.manage' })).toBeVisible();
  });

  test('creates a staff account and reassigns its role', async ({ page }) => {
    const email = `e2e-${Date.now()}@za-store.local`;

    await page.goto('/staff');
    await expect(page.getByRole('heading', { name: 'Staff' })).toBeVisible();

    await page.getByRole('button', { name: 'Add staff account' }).click();
    const createDialog = page.getByRole('dialog', { name: 'Add staff account' });
    await createDialog.getByLabel('Name').fill('E2E Test Staff');
    await createDialog.getByLabel('Email').fill(email);
    await createDialog.getByLabel('Temporary password').fill('E2ETestPassword1234');
    await createDialog.getByLabel('Role').selectOption({ label: 'Warehouse' });
    await createDialog.getByRole('button', { name: 'Create account' }).click();
    await expect(createDialog).not.toBeVisible();

    await expect(page.getByRole('cell', { name: email })).toBeVisible();

    const row = page.locator('table tbody tr', { hasText: email });
    await row.getByRole('button', { name: 'Change role' }).click();
    const roleDialog = page.getByRole('dialog', { name: /change .*'s role/i });
    await roleDialog.getByLabel('New role').selectOption({ label: 'Sales' });
    await expect(roleDialog).not.toBeVisible();

    await row.getByRole('button', { name: 'Deactivate' }).click();
    await expect(row.getByText('Inactive')).toBeVisible();
  });
});
