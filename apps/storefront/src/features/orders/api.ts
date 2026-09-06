import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { useCustomerAuth } from '@/lib/auth/auth-context';
import type { CardCheckoutSession, InitiateCardCheckoutInput, Order, PlaceOrderInput } from './types';

const ORDERS_KEY = 'orders';
const CONFIRMATION_KEY = 'order-confirmation';

/**
 * Guest checkout stays fully public (ADR 0015/0018, unchanged) — this
 * mutation never attaches a customer token, whether or not one exists.
 *
 * There is no `GET` endpoint that can re-fetch a guest's own order
 * (ADR 0018 §5/§13, disclosed) — `POST /checkout/place-order`'s
 * response is the *only* time this order's data is ever reachable
 * without a customer session. It's cached here under a dedicated key
 * so the confirmation page can read it after the redirect, without
 * fabricating a lookup the API doesn't offer.
 */
export function usePlaceOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PlaceOrderInput) =>
      apiFetch<Order>('/checkout/place-order', { method: 'POST', auth: false, body: values }),
    onSuccess: (order, { guestToken }) => {
      queryClient.setQueryData([CONFIRMATION_KEY, order.id], order);
      return queryClient.invalidateQueries({ queryKey: ['cart', guestToken] });
    },
  });
}

/**
 * The CARD counterpart to `usePlaceOrderMutation` — never returns an
 * `Order` (none exists yet, per ADR 0026's "no order until payment
 * succeeds"). Reserves stock and starts a Stripe Checkout Session; the
 * caller redirects the browser to `checkoutUrl`.
 */
export function useInitiateCardCheckoutMutation() {
  return useMutation({
    mutationFn: (values: InitiateCardCheckoutInput) =>
      apiFetch<CardCheckoutSession>('/checkout/card-sessions', { method: 'POST', auth: false, body: values }),
  });
}

/** Reads the order this session just placed, from cache only — never refetched (see usePlaceOrderMutation). */
export function useOrderConfirmationQuery(orderId: string) {
  return useQuery<Order | undefined>({
    queryKey: [CONFIRMATION_KEY, orderId],
    queryFn: () => Promise.resolve(undefined),
    enabled: false,
    initialData: undefined,
  });
}

export function useCustomerOrdersQuery() {
  const { isAuthenticated } = useCustomerAuth();
  return useQuery({
    queryKey: [ORDERS_KEY],
    queryFn: () => apiFetch<Order[]>('/customers/me/orders'),
    enabled: isAuthenticated,
  });
}

/**
 * No single-order-by-id endpoint for customers exists — only the full
 * list (`GET /customers/me/orders`, ADR 0018 §5). Order Tracking's
 * detail view finds the order in that same list rather than fabricating
 * a lookup the API doesn't offer.
 */
export function useCustomerOrderQuery(orderId: string) {
  const ordersQuery = useCustomerOrdersQuery();
  return {
    ...ordersQuery,
    data: ordersQuery.data?.find((order) => order.id === orderId),
  };
}
