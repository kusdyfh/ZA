import { expect, test } from '@playwright/test';

test.describe('Shipping zones', () => {
  test('creates and edits a shipping zone', async ({ page }) => {
    const zoneName = `E2E Zone ${Date.now()}`;
    const updatedName = `${zoneName} (updated)`;

    await page.goto('/shipping/zones');
    await expect(page.getByRole('heading', { name: 'Shipping zones' })).toBeVisible();

    await page.getByRole('button', { name: 'Add zone' }).click();
    const createDialog = page.getByRole('dialog', { name: 'Add shipping zone' });
    await createDialog.getByLabel('Name').fill(zoneName);
    await createDialog.getByLabel('Governorates').fill('Baghdad, Basra');
    await createDialog.getByRole('button', { name: 'Save' }).click();
    await expect(createDialog).not.toBeVisible();

    const row = page.locator('table tbody tr').filter({ hasText: zoneName });
    await expect(row).toBeVisible();
    await expect(row.getByText('Baghdad, Basra')).toBeVisible();

    await page.getByRole('button', { name: `Edit ${zoneName}` }).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit shipping zone' });
    await editDialog.getByLabel('Name').fill(updatedName);
    await editDialog.getByRole('button', { name: 'Save' }).click();
    await expect(editDialog).not.toBeVisible();

    await expect(page.locator('table tbody tr').filter({ hasText: updatedName })).toBeVisible();
  });
});

test.describe('Shipping methods', () => {
  test('creates and edits a shipping method', async ({ page }) => {
    const methodName = `E2E Method ${Date.now()}`;
    const updatedName = `${methodName} (updated)`;

    await page.goto('/shipping/methods');
    await expect(page.getByRole('heading', { name: 'Shipping methods' })).toBeVisible();

    await page.getByRole('button', { name: 'Add method' }).click();
    const createDialog = page.getByRole('dialog', { name: 'Add shipping method' });
    await createDialog.getByLabel('Name').fill(methodName);
    await createDialog.getByLabel('Min days').fill('2');
    await createDialog.getByLabel('Max days').fill('5');
    await createDialog.getByRole('button', { name: 'Save' }).click();
    await expect(createDialog).not.toBeVisible();

    const row = page.locator('table tbody tr').filter({ hasText: methodName });
    await expect(row).toBeVisible();
    await expect(row.getByText('2-5 business days')).toBeVisible();

    await page.getByRole('button', { name: `Edit ${methodName}` }).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit shipping method' });
    await editDialog.getByLabel('Name').fill(updatedName);
    await editDialog.getByRole('button', { name: 'Save' }).click();
    await expect(editDialog).not.toBeVisible();

    await expect(page.locator('table tbody tr').filter({ hasText: updatedName })).toBeVisible();
  });
});

test.describe('Shipping rates', () => {
  test('creates and edits a shipping rate for a zone/method pair', async ({ page }) => {
    const zoneName = `E2E Rate Zone ${Date.now()}`;
    const methodName = `E2E Rate Method ${Date.now()}`;

    // A dedicated zone and method, created here rather than reused from the
    // specs above — this test must stand on its own regardless of run order.
    await page.goto('/shipping/zones');
    await page.getByRole('button', { name: 'Add zone' }).click();
    const zoneDialog = page.getByRole('dialog', { name: 'Add shipping zone' });
    await zoneDialog.getByLabel('Name').fill(zoneName);
    await zoneDialog.getByLabel('Governorates').fill('Erbil');
    await zoneDialog.getByRole('button', { name: 'Save' }).click();
    await expect(zoneDialog).not.toBeVisible();

    await page.goto('/shipping/methods');
    await page.getByRole('button', { name: 'Add method' }).click();
    const methodDialog = page.getByRole('dialog', { name: 'Add shipping method' });
    await methodDialog.getByLabel('Name').fill(methodName);
    await methodDialog.getByLabel('Min days').fill('1');
    await methodDialog.getByLabel('Max days').fill('3');
    await methodDialog.getByRole('button', { name: 'Save' }).click();
    await expect(methodDialog).not.toBeVisible();

    await page.goto('/shipping/rates');
    await expect(page.getByRole('heading', { name: 'Shipping rates' })).toBeVisible();

    await page.getByRole('button', { name: 'Set rate' }).click();
    const createDialog = page.getByRole('dialog', { name: 'Set shipping rate' });
    await createDialog.getByLabel('Zone').selectOption({ label: zoneName });
    await createDialog.getByLabel('Method').selectOption({ label: methodName });
    await createDialog.getByLabel('Fee').fill('5000');
    await createDialog.getByRole('button', { name: 'Save' }).click();
    await expect(createDialog).not.toBeVisible();

    const row = page.locator('table tbody tr').filter({ hasText: zoneName }).filter({ hasText: methodName });
    await expect(row).toBeVisible();
    await expect(row.getByText('5000', { exact: true })).toBeVisible();

    await row.getByRole('button', { name: 'Edit rate' }).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit shipping rate' });
    await editDialog.getByLabel('Fee').fill('7500');
    await editDialog.getByRole('button', { name: 'Save' }).click();
    await expect(editDialog).not.toBeVisible();

    await expect(row.getByText('7500', { exact: true })).toBeVisible();
  });
});
