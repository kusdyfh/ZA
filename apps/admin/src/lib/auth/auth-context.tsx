'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../api/client';
import {
  AUTH_CHANGED_EVENT,
  clearStoredAuth,
  getStoredAuth,
  setStoredAuth,
  type StoredAdminUser,
} from './token-storage';

interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  adminUser?: StoredAdminUser;
}

interface AuthContextValue {
  adminUser: StoredAdminUser | null;
  isAuthenticated: boolean;
  /** False until the initial localStorage read completes — avoids a flash-redirect to /login on reload. */
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<StoredAdminUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const sync = () => setAdminUser(getStoredAuth()?.adminUser ?? null);
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
    const result = await apiFetch<AuthTokensResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    if (!result.adminUser) {
      throw new Error('Login succeeded but the server did not return an admin user.');
    }
    setStoredAuth({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      adminUser: result.adminUser,
    });
    setAdminUser(result.adminUser);
  }, []);

  const logout = useCallback(async () => {
    const stored = getStoredAuth();
    clearStoredAuth();
    setAdminUser(null);
    if (stored?.refreshToken) {
      try {
        await apiFetch('/auth/logout', { method: 'POST', body: { refreshToken: stored.refreshToken } });
      } catch {
        // Already cleared locally — a failed server-side revoke shouldn't block navigating away.
      }
    }
    router.push('/login');
  }, [router]);

  const value = useMemo(
    () => ({ adminUser, isAuthenticated: adminUser !== null, isInitializing, login, logout }),
    [adminUser, isInitializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
