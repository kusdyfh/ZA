const STORAGE_KEY = 'za-guest-token';

/**
 * A client-generated cart token for a signed-out visitor — functionally
 * identical to the token a logged-in customer already carries as
 * `Customer.cartToken` (ADR 0018 §3), generated once and reused across
 * visits so a guest's cart survives a reload (ADR 0022 §3).
 */
export function getOrCreateGuestToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const token = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, token);
  return token;
}

export function getGuestToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(STORAGE_KEY);
}

export function clearGuestToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}
