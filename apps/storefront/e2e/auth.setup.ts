import { test as setup } from '@playwright/test';
import { registerOrLoginCustomer } from './helpers';

const AUTH_FILE = 'e2e/.auth/customer.json';

setup('register or sign in as the throwaway E2E customer', async ({ page }) => {
  await registerOrLoginCustomer(page);
  await page.context().storageState({ path: AUTH_FILE });
});
