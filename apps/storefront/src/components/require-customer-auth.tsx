'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Spinner } from '@za/ui';
import { useCustomerAuth } from '@/lib/auth/auth-context';

/** Wraps every /account/* page — client-side redirect to /login when signed out (ADR 0022 §5: no server-side session to gate on). */
export function RequireCustomerAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useCustomerAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isInitializing, isAuthenticated, pathname, router]);

  if (isInitializing || !isAuthenticated) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
