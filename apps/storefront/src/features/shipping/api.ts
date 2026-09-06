import { useQuery } from '@tanstack/react-query';
import { apiFetch, buildQueryString } from '@/lib/api/client';
import type { Shipment, ShippingMethod, ShippingRateQuote } from './types';

export function useShippingMethodsQuery() {
  return useQuery({
    queryKey: ['storefront-shipping-methods'],
    queryFn: () => apiFetch<ShippingMethod[]>('/storefront/shipping/methods', { auth: false }),
    staleTime: 5 * 60_000,
  });
}

export interface ShippingRateQuoteParams {
  governorate: string;
  methodId: string;
  subtotal: number;
  discountTotal?: number;
}

/** Re-quoted whenever the governorate, method, or cart subtotal changes — mirrors what `PlaceOrderUseCase` computes server-side. */
export function useShippingRateQuoteQuery(params: ShippingRateQuoteParams | null) {
  return useQuery({
    queryKey: ['storefront-shipping-quote', params],
    queryFn: () => {
      const { governorate, methodId, subtotal, discountTotal } = params as ShippingRateQuoteParams;
      return apiFetch<ShippingRateQuote>(
        `/storefront/shipping/quote${buildQueryString({ governorate, methodId, subtotal, discountTotal })}`,
        { auth: false },
      );
    },
    enabled: Boolean(params?.governorate && params?.methodId),
    retry: false,
  });
}

/**
 * Guest-friendly tracking (ADR 0027) — ownership proven by order number +
 * email, never a session. Used both by the standalone "Track your order"
 * page and automatically on a signed-in customer's own order detail page.
 */
export function useTrackShipmentQuery(orderNumber: string, email: string, enabled = true) {
  return useQuery({
    queryKey: ['track-shipment', orderNumber, email],
    queryFn: () =>
      apiFetch<Shipment>(`/shipments/track${buildQueryString({ orderNumber, email })}`, { auth: false }),
    enabled: enabled && Boolean(orderNumber && email),
    retry: false,
  });
}
