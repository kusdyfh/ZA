export interface StoredAdminUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
}

export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  adminUser: StoredAdminUser;
}

const STORAGE_KEY = 'za-admin-auth';
export const AUTH_CHANGED_EVENT = 'za-admin-auth-changed';

/**
 * Plain localStorage, not an httpOnly cookie — the API issues tokens in
 * the response body, not Set-Cookie, and there's no BFF to hold one
 * (ADR 0019 §2, a disclosed trade-off). A same-tab custom event lets
 * AuthProvider react to changes made outside its own setters (e.g. a
 * background token refresh in api/client.ts).
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
