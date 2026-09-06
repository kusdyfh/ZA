import type { APIRequestContext, Page } from '@playwright/test';

export const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@za-store.local';
export const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'ChangeThisPassword123';

/** Logs in via the real login form and waits for the dashboard to load. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(E2E_ADMIN_EMAIL);
  await page.getByLabel('Password').fill(E2E_ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/');
  // Scoped to `main` — the header nav also renders a "Dashboard" heading
  // (its active-page breadcrumb), which otherwise collides in strict mode.
  await page.getByRole('main').getByRole('heading', { name: 'Dashboard' }).waitFor();
}

// Playwright's Node process doesn't load apps/admin/.env.local (that's
// Next.js-specific env loading) — the API's actual dev port for this repo is
// 4100 (see apps/admin/.env.local, .claude/launch.json), not Next's own 4000.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/v1';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

interface StorefrontVariant {
  id: string;
}

interface StorefrontProductDetail {
  variants: StorefrontVariant[];
}

interface StorefrontShippingMethod {
  id: string;
  name: string;
}

interface PlacedOrder {
  id: string;
  orderNumber: string;
}

export interface PlacedGuestOrder {
  orderId: string;
  orderNumber: string;
}

/**
 * Seeds one real guest COD order straight over HTTP against the API —
 * admin's own e2e run only starts the admin dev server (see
 * `playwright.config.ts`), not the storefront's, so `shipments.spec.ts`
 * can't drive the storefront's checkout UI to get itself a fresh
 * `PENDING` shipment to dispatch. This calls the exact same public
 * `POST /checkout/cart/items` + `POST /checkout/place-order` endpoints
 * the storefront's own guest checkout uses, so the resulting order and
 * its eagerly-created Shipment (`PlaceOrderUseCase`, ADR 0027) are
 * indistinguishable from ones placed through the real storefront.
 */
export async function placeGuestOrderViaApi(request: APIRequestContext): Promise<PlacedGuestOrder> {
  const guestToken = `admin-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const productDetailResponse = await request.get(
    `${API_BASE_URL}/catalog/storefront/products/classic-v-neck-scrub-top/detail`,
  );
  const productDetailBody = (await productDetailResponse.json()) as ApiEnvelope<StorefrontProductDetail>;
  const variant = productDetailBody.data.variants[0];
  if (!variant) {
    throw new Error('Seeded product "classic-v-neck-scrub-top" has no variants to check out with.');
  }

  const methodsResponse = await request.get(`${API_BASE_URL}/storefront/shipping/methods`);
  const methodsBody = (await methodsResponse.json()) as ApiEnvelope<StorefrontShippingMethod[]>;
  const shippingMethod = methodsBody.data.find((method) => /Standard Delivery/.test(method.name)) ?? methodsBody.data[0];
  if (!shippingMethod) {
    throw new Error('No shipping methods are configured to check out with.');
  }

  await request.post(`${API_BASE_URL}/checkout/cart/items`, {
    data: { guestToken, variantId: variant.id, quantity: 1 },
  });

  const orderResponse = await request.post(`${API_BASE_URL}/checkout/place-order`, {
    data: {
      guestToken,
      customerName: 'Admin E2E Shopper',
      customerEmail: `admin-e2e-${Date.now()}@example.com`,
      customerPhone: '07701234567',
      shippingFullName: 'Admin E2E Shopper',
      shippingPhone: '07701234567',
      shippingLine1: '123 Karrada Street',
      shippingCity: 'Baghdad',
      shippingGovernorate: 'Baghdad',
      shippingCountry: 'Iraq',
      shippingMethodId: shippingMethod.id,
      paymentMethod: 'COD',
    },
  });
  const orderBody = (await orderResponse.json()) as ApiEnvelope<PlacedOrder>;
  return { orderId: orderBody.data.id, orderNumber: orderBody.data.orderNumber };
}
