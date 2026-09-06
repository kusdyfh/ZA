'use client';

import { useEffect, useState } from 'react';
import { useCustomerAuth } from '../auth/auth-context';
import { getOrCreateGuestToken } from './guest-token';

/**
 * The single cart-token concept the Checkout API actually understands
 * (ADR 0018 §3 / ADR 0022 §3): a logged-in customer's own permanent
 * `cartToken`, or a client-generated guest token persisted across
 * visits. Never both — a customer's guest token is merged server-side
 * at login/register and should not be used again afterward.
 */
export function useCartToken(): string {
  const { customer, isInitializing } = useCustomerAuth();
  const [guestToken, setGuestToken] = useState('');

  useEffect(() => {
    if (!customer) {
      setGuestToken(getOrCreateGuestToken());
    }
  }, [customer]);

  if (isInitializing) {
    return '';
  }

  return customer?.cartToken ?? guestToken;
}
