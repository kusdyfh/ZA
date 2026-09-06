export interface StoredCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  marketingOptIn: boolean;
  cartToken: string;
}

export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  customer: StoredCustomer;
}

const STORAGE_KEY = 'za-customer-auth';
export const AUTH_CHANGED_EVENT = 'za-customer-auth-changed';

/**
 * Plain localStorage, not an httpOnly cookie — same disclosed trade-off
 * as the admin dashboard (ADR 0019 §2), mirrored here for customers
 * (ADR 0022 §2). A same-tab custom event lets CustomerAuthProvider react
 * to changes made outside its own setters (a background token refresh
 * in api/client.ts).
 */
export function getStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: StoredAuth): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
