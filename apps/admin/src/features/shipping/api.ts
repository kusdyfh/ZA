import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import type { Shipment, ShippingMethod, ShippingRate, ShippingZone } from './types';

const ZONES_KEY = 'shipping-zones';
const METHODS_KEY = 'shipping-methods';
const RATES_KEY = 'shipping-rates';
const SHIPMENTS_KEY = 'shipments';

/** Every list here is a plain array (no `meta`/pagination) — admin-configured settings data, not customer-facing volume. */
export function useShippingZonesQuery() {
  return useQuery({
    queryKey: [ZONES_KEY],
    queryFn: () => apiFetch<ShippingZone[]>('/shipping/zones'),
  });
}

export function useCreateShippingZoneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { name: string; governorates: string[] }) =>
      apiFetch<ShippingZone>('/shipping/zones', { method: 'POST', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ZONES_KEY] }),
  });
}

export function useUpdateShippingZoneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: { name?: string; governorates?: string[]; isActive?: boolean } }) =>
      apiFetch<ShippingZone>(`/shipping/zones/${id}`, { method: 'PATCH', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ZONES_KEY] }),
  });
}

export function useShippingMethodsQuery() {
  return useQuery({
    queryKey: [METHODS_KEY],
    queryFn: () => apiFetch<ShippingMethod[]>('/shipping/methods'),
  });
}

export function useCreateShippingMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { name: string; minDays: number; maxDays: number }) =>
      apiFetch<ShippingMethod>('/shipping/methods', { method: 'POST', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [METHODS_KEY] }),
  });
}

export function useUpdateShippingMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: { name?: string; minDays?: number; maxDays?: number; isActive?: boolean };
    }) => apiFetch<ShippingMethod>(`/shipping/methods/${id}`, { method: 'PATCH', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [METHODS_KEY] }),
  });
}

export function useShippingRatesQuery() {
  return useQuery({
    queryKey: [RATES_KEY],
    queryFn: () => apiFetch<ShippingRate[]>('/shipping/rates'),
  });
}

export function useSetShippingRateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { zoneId: string; methodId: string; fee: number; freeShippingThreshold?: number }) =>
      apiFetch<ShippingRate>('/shipping/rates', { method: 'POST', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [RATES_KEY] }),
  });
}

export function useShipmentsQuery() {
  return useQuery({
    queryKey: [SHIPMENTS_KEY],
    queryFn: () => apiFetch<Shipment[]>('/shipments'),
  });
}

export function useShipmentQuery(id: string) {
  return useQuery({
    queryKey: [SHIPMENTS_KEY, id],
    queryFn: () => apiFetch<Shipment>(`/shipments/${id}`),
    enabled: Boolean(id),
  });
}

export function useDispatchShipmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, trackingNumber, carrierName }: { id: string; trackingNumber: string; carrierName?: string }) =>
      apiFetch<Shipment>(`/shipments/${id}/dispatch`, { method: 'POST', body: { trackingNumber, carrierName } }),
    onSuccess: (_, { id }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [SHIPMENTS_KEY] }),
        queryClient.invalidateQueries({ queryKey: [SHIPMENTS_KEY, id] }),
      ]),
  });
}

export function useMarkShipmentDeliveredMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<Shipment>(`/shipments/${id}/deliver`, { method: 'POST' }),
    onSuccess: (_, id) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [SHIPMENTS_KEY] }),
        queryClient.invalidateQueries({ queryKey: [SHIPMENTS_KEY, id] }),
      ]),
  });
}
