import { expect, test } from '@playwright/test';
import { placeGuestOrderViaApi } from './helpers';

/**
 * Exercises the full staff dispatch flow (ADR 0027): a fresh order's
 * Shipment starts PENDING, `Dispatch` moves it to IN_TRANSIT and walks
 * the linked Order through the fulfillment path to SHIPPED
 * (`DispatchShipmentUseCase`), and `Mark delivered` finishes both at
 * DELIVERED. Seeds its own order via `placeGuestOrderViaApi` (the admin
 * app's e2e run doesn't start the storefront dev server, so there's no
 * UI path here to place one) rather than depending on a seeded shipment
 * — the pre-Epic-12 demo order seed doesn't create one at all.
 */
test.describe('Shipments', () => {
  test('dispatches a shipment through to delivered and advances the order to SHIPPED', async ({ page, request }) => {
    const { orderId } = await placeGuestOrderViaApi(request);

    await page.goto('/shipping/shipments');
    await expect(page.getByRole('heading', { name: 'Shipments' })).toBeVisible();

    const row = page.locator('table tbody tr').filter({ hasText: orderId });
    await expect(row).toBeVisible();
    await expect(row.getByText('PENDING', { exact: true })).toBeVisible();

    await row.getByRole('link', { name: 'View' }).click();
    await expect(page.getByRole('heading', { name: `Shipment for order ${orderId}` })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dispatch' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark delivered' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Dispatch' }).click();
    const dispatchDialog = page.getByRole('dialog', { name: 'Dispatch shipment' });
    await dispatchDialog.getByLabel('Tracking number').fill('TRACK-123456');
    await dispatchDialog.getByLabel('Carrier (optional)').fill('Aramex');
    await dispatchDialog.getByRole('button', { name: 'Dispatch' }).click();
    await expect(dispatchDialog).not.toBeVisible();

    await expect(page.getByText('IN_TRANSIT', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dispatch' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Mark delivered' })).toBeVisible();

    await page.getByRole('button', { name: 'Mark delivered' }).click();
    await expect(page.getByText('DELIVERED', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark delivered' })).toHaveCount(0);

    await page.getByRole('link', { name: /View order/ }).click();
    await expect(page.getByRole('heading', { name: /^Order / })).toBeVisible();
    await expect(page.getByText('Status history', { exact: true })).toBeVisible();
    await expect(page.getByText('SHIPPED', { exact: true })).toBeVisible();
  });
});
