import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, buildQueryString } from '@/lib/api/client';
import type { CartView } from './types';

const CART_KEY = 'cart';

export function useCartQuery(cartToken: string) {
  return useQuery({
    queryKey: [CART_KEY, cartToken],
    queryFn: () => apiFetch<CartView>(`/checkout/cart${buildQueryString({ guestToken: cartToken })}`, { auth: false }),
    enabled: Boolean(cartToken),
  });
}

/**
 * Every mutation below returns the thin `CartResponseDto` (no price, no
 * name — ADR 0022 §4), so none of them are used for display: each
 * `onSuccess` just invalidates the priced `GET /checkout/cart` query,
 * which the UI actually renders from.
 */
export function useAddCartItemMutation(cartToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { variantId: string; quantity: number }) =>
      apiFetch('/checkout/cart/items', {
        method: 'POST',
        auth: false,
        body: { guestToken: cartToken, ...values },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CART_KEY, cartToken] }),
  });
}

export function useUpdateCartItemMutation(cartToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { variantId: string; quantity: number }) =>
      apiFetch('/checkout/cart/items', {
        method: 'PATCH',
        auth: false,
        body: { guestToken: cartToken, ...values },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CART_KEY, cartToken] }),
  });
}

export function useRemoveCartItemMutation(cartToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { variantId: string }) =>
      apiFetch('/checkout/cart/items', {
        method: 'DELETE',
        auth: false,
        body: { guestToken: cartToken, ...values },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CART_KEY, cartToken] }),
  });
}
