import { expect, test } from '@playwright/test';
import { addSeededProductToCart } from './helpers';

test.use({ storageState: { cookies: [], origins: [] } });

/**
 * `PlaceOrderUseCase` creates the order's `Shipment` eagerly, in the same
 * transaction that confirms a COD order, at `PENDING` (see
 * apps/api/.../checkout/application/use-cases/place-order.use-case.ts and
 * `Shipment`'s own doc comment: "created automatically at PENDING the
 * moment an Order is created"). So a freshly-placed COD order already has
 * a trackable shipment the instant checkout completes — this test
 * exercises that real path rather than a fabricated one.
 */
test.describe('Guest order tracking', () => {
  test('tracks a freshly-placed COD order and sees its PENDING shipment status', async ({ page }) => {
    const trackingEmail = `track-${Date.now()}@example.com`;

    await addSeededProductToCart(page);
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();

    await page.getByLabel('Full name').first().fill('Jane Tracker');
    await page.getByLabel('Email').fill(trackingEmail);
    await page.getByLabel('Phone').first().fill('07701234567');

    await page.getByLabel('Full name').nth(1).fill('Jane Tracker');
    await page.getByLabel('Phone').nth(1).fill('07701234567');
    await page.getByLabel('Address line 1').fill('123 Karrada Street');
    await page.getByLabel('City').fill('Baghdad');
    await page.getByLabel('Governorate').fill('Baghdad');
    await page.getByLabel('Delivery method').selectOption({ label: 'Standard Delivery (2-5 business days)' });

    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page).toHaveURL(/\/checkout\/confirmation\//);

    const confirmationText = await page.getByText(/^Order #/).textContent();
    const orderNumber = confirmationText?.match(/Order #(\S+) has been placed/)?.[1];
    expect(orderNumber).toBeTruthy();

    await page.goto('/track-order');
    await expect(page.getByRole('heading', { name: 'Track your order' })).toBeVisible();

    await page.getByLabel('Order number').fill(orderNumber!);
    await page.getByLabel('Email').fill(trackingEmail);
    await page.getByRole('button', { name: 'Track order' }).click();

    await expect(page.getByText('Shipment status')).toBeVisible();
    // The initial tracking event is also PENDING, so the status badge and the
    // first timeline entry both render the same text — scope to the first.
    await expect(page.getByText('PENDING', { exact: true }).first()).toBeVisible();
    await expect(page.getByText("We couldn't find that order")).not.toBeVisible();
  });
});
