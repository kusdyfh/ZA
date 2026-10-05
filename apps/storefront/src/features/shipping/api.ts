import { useQueries, useQuery } from '@tanstack/react-query';
import { apiFetch, buildQueryString } from '@/lib/api/client';
import type { Shipment, ShippingMethod, ShippingRateQuote } from './types';

export function useShippingMethodsQuery() {
  return useQuery({
    queryKey: ['storefront-shipping-methods'],
    queryFn: () =>
      apiFetch<ShippingMethod[]>('/storefront/shipping/methods', {
        auth: false,
      }),
    staleTime: 5 * 60_000,
  });
}

export interface ShippingRateQuoteParams {
  governorate: string;
  methodId: string;
  subtotal: number;
  discountTotal?: number;
}

function fetchShippingQuote({
  governorate,
  methodId,
  subtotal,
  discountTotal,
}: ShippingRateQuoteParams) {
  return apiFetch<ShippingRateQuote>(
    `/storefront/shipping/quote${buildQueryString({ governorate, methodId, subtotal, discountTotal })}`,
    { auth: false },
  );
}

export interface AutoShippingChoice {
  /** The delivery method the order will use; null until one is confirmed for the governorate. */
  method: ShippingMethod | null;
  quote: ShippingRateQuote | null;
  isChecking: boolean;
  /** Every method was asked and none delivers to the governorate. */
  isUnavailable: boolean;
}

/**
 * The checkout no longer asks the customer to pick a delivery method. The
 * order API still needs one (it prices and ships against it), so this asks each
 * active method for a quote to the entered governorate, in the order the API
 * lists them, and uses the first that can deliver there. Re-asked whenever the
 * governorate or cart subtotal changes — mirrors what `PlaceOrderUseCase`
 * computes server-side.
 */
export function useAutoShippingMethod(
  governorate: string,
  subtotal: number | null,
): AutoShippingChoice {
  const { data: methods } = useShippingMethodsQuery();
  const isEnabled = Boolean(governorate) && subtotal !== null;
  const quotes = useQueries({
    queries: (methods ?? []).map((method) => ({
      queryKey: [
        'storefront-shipping-quote',
        { governorate, methodId: method.id, subtotal },
      ],
      queryFn: () =>
        fetchShippingQuote({
          governorate,
          methodId: method.id,
          subtotal: subtotal as number,
        }),
      enabled: isEnabled,
      retry: false,
      staleTime: 60_000,
    })),
  });

  if (!isEnabled || !methods) {
    return {
      method: null,
      quote: null,
      isChecking: false,
      isUnavailable: false,
    };
  }

  // Walk in order and stop at the first method still waiting on its first
  // answer, so a later method never wins while an earlier one is undecided.
  for (let index = 0; index < methods.length; index += 1) {
    const result = quotes[index]!;
    if (result.status === 'pending') {
      return {
        method: null,
        quote: null,
        isChecking: true,
        isUnavailable: false,
      };
    }
    if (result.status === 'success') {
      return {
        method: methods[index]!,
        quote: result.data,
        isChecking: false,
        isUnavailable: false,
      };
    }
  }
  return { method: null, quote: null, isChecking: false, isUnavailable: true };
}

/**
 * Guest-friendly tracking (ADR 0027) — ownership proven by order number +
 * email, never a session. Used both by the standalone "Track your order"
 * page and automatically on a signed-in customer's own order detail page.
 */
export function useTrackShipmentQuery(
  orderNumber: string,
  email: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ['track-shipment', orderNumber, email],
    queryFn: () =>
      apiFetch<Shipment>(
        `/shipments/track${buildQueryString({ orderNumber, email })}`,
        { auth: false },
      ),
    enabled: enabled && Boolean(orderNumber && email),
    retry: false,
  });
}
