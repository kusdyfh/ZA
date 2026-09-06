import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Epic 13 (Brand Experience & Theme Transformation) — covers the new
 * illustrated presentation layer without duplicating the functional
 * coverage already in browsing.spec.ts/cart-and-checkout.spec.ts. Every
 * assertion here targets brand-new UI (BrandHero, Character Showcase,
 * Dress Showcase, Newsletter, EditorialHeader); it never re-asserts cart,
 * checkout, or account behavior those specs already own.
 */
test.describe('Brand Experience homepage', () => {
  test('renders the illustrated hero and real featured products beneath it', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Soft, modern medical wear' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Shop now' })).toHaveAttribute('href', '/shop');

    await expect(page.getByRole('heading', { name: 'Character Showcase' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Medical Student/ })).toBeVisible();

    // Product data on the new shelves is still the real, existing catalog.
    await expect(page.getByRole('link', { name: /Classic V-Neck Scrub Top/ }).first()).toBeVisible();
  });

  test('advances the Dress Showcase to the next look', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('heading', { name: 'Dress Showcase' }).scrollIntoViewIfNeeded();

    await expect(page.getByText('Featured Looks')).toBeVisible();
    await page.getByRole('button', { name: 'Next look' }).click();
    await expect(page.getByText('Fan Favorites')).toBeVisible();
  });

  test('subscribes to the newsletter and shows a confirmation', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Email address').scrollIntoViewIfNeeded();

    await page.getByLabel('Email address').fill('shopper@example.com');
    await page.getByRole('button', { name: 'Subscribe' }).click();

    await expect(page.getByText('Thank you! See you soon.')).toBeVisible();
    // A real subscribe, not a native form submission that would reload the page.
    await expect(page.getByRole('heading', { name: 'Soft, modern medical wear' })).toBeVisible();
  });

  test('opens a product from the homepage into the redesigned product page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Classic V-Neck Scrub Top/ }).first().click();

    await expect(page.getByText('Made with care')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Classic V-Neck Scrub Top' })).toBeVisible();
  });
});

test.describe('Brand Experience editorial pages', () => {
  test('About page shows the illustrated header above the real CMS content', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByText('Our Story')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'About ZA Store' })).toBeVisible();
  });

  test('FAQ page keeps working accordion behavior under the illustrated header', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.getByText('Questions?')).toBeVisible();

    const question = page.getByRole('button', { name: 'How long does shipping take?' });
    await question.click();
    await expect(page.getByText(/Orders are dispatched/)).toBeVisible();
  });

  test('Contact page keeps the real form validation working under the illustrated header', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByText('Say Hello')).toBeVisible();

    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Message is required')).toBeVisible();
  });
});
