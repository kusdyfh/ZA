'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@za/ui';
import { CustomerAuthProvider } from './auth/auth-context';
import { CartDrawerProvider } from './cart/cart-drawer-context';
import { getQueryClient } from './query-client';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <CustomerAuthProvider>
        <CartDrawerProvider>
          <ToastProvider>{children}</ToastProvider>
        </CartDrawerProvider>
      </CustomerAuthProvider>
    </QueryClientProvider>
  );
}
