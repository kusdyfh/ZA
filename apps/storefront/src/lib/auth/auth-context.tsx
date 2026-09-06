'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../api/client';
import { getGuestToken, clearGuestToken } from '../cart/guest-token';
import {
  AUTH_CHANGED_EVENT,
  clearStoredAuth,
  getStoredAuth,
  setStoredAuth,
  type StoredCustomer,
} from './token-storage';

interface CustomerAuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  customer?: StoredCustomer;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  marketingOptIn?: boolean;
}

interface CustomerAuthContextValue {
  customer: StoredCustomer | null;
  isAuthenticated: boolean;
  /** False until the initial localStorage read completes — avoids a flash of signed-out UI on reload. */
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Refetches /customers/me and updates the stored copy — call after a profile/address edit. */
  refreshCustomer: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<StoredCustomer | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const sync = () => setCustomer(getStoredAuth()?.customer ?? null);
    sync();
    setIsInitializing(false);
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const guestToken = getGuestToken();
    const result = await apiFetch<CustomerAuthTokensResponse>('/customers/auth/login', {
      method: 'POST',
      body: { email, password, guestToken: guestToken || undefined },
      auth: false,
    });
    if (!result.customer) {
      throw new Error('Login succeeded but the server did not return a customer.');
    }
    setStoredAuth({ accessToken: result.accessToken, refreshToken: result.refreshToken, customer: result.customer });
    setCustomer(result.customer);
    if (guestToken) {
      clearGuestToken();
    }
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const guestToken = getGuestToken();
    const result = await apiFetch<CustomerAuthTokensResponse>('/customers/auth/register', {
      method: 'POST',
      body: { ...input, guestToken: guestToken || undefined },
      auth: false,
    });
    if (!result.customer) {
      throw new Error('Registration succeeded but the server did not return a customer.');
    }
    setStoredAuth({ accessToken: result.accessToken, refreshToken: result.refreshToken, customer: result.customer });
    setCustomer(result.customer);
    if (guestToken) {
      clearGuestToken();
    }
  }, []);

  const logout = useCallback(async () => {
    const stored = getStoredAuth();
    clearStoredAuth();
    setCustomer(null);
    if (stored?.refreshToken) {
      try {
        await apiFetch('/customers/auth/logout', { method: 'POST', body: { refreshToken: stored.refreshToken } });
      } catch {
        // Already cleared locally — a failed server-side revoke shouldn't block navigating away.
      }
    }
    router.push('/');
  }, [router]);

  const refreshCustomer = useCallback(async () => {
    const stored = getStoredAuth();
    if (!stored) {
      return;
    }
    const updated = await apiFetch<StoredCustomer>('/customers/me');
    setStoredAuth({ ...stored, customer: updated });
    setCustomer(updated);
  }, []);

  const value = useMemo(
    () => ({
      customer,
      isAuthenticated: customer !== null,
      isInitializing,
      login,
      register,
      logout,
      refreshCustomer,
    }),
    [customer, isInitializing, login, register, logout, refreshCustomer],
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth(): CustomerAuthContextValue {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
