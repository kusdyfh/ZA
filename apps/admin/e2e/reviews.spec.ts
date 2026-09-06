import { expect, test } from '@playwright/test';

test.describe('Reviews', () => {
  test('shows the moderation queue (empty or populated) without error', async ({ page }) => {
    await page.goto('/reviews');
    await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible();
    await expect(page.getByText(/no endpoint for already-approved/i)).toBeVisible();

    // No customer reviews are seeded, so the queue is expected to be empty —
    // asserting the real empty state, not just "the page didn't crash".
    await expect(page.getByText('Nothing to moderate')).toBeVisible();
  });
});
