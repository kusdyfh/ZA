import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, buildQueryString } from '@/lib/api/client';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
}

export interface WarehouseFormValues {
  name: string;
  code: string;
  isDefault?: boolean;
}

export interface VariantStock {
  variantId: string;
  warehouseId: string;
  quantity: number;
  available: number;
  lowStockThreshold: number | null;
  isLowStock: boolean;
}

export interface StockMovement {
  id: string;
  variantId: string;
  warehouseId: string;
  type: string;
  quantity: number;
  resultingStock: number;
  reason: string | null;
  note: string | null;
  actorId: string | null;
  actorType: string;
  createdAt: string;
}

export type AdjustReason = 'STOCKTAKE_CORRECTION' | 'DAMAGED' | 'FOUND' | 'OTHER';
export type ReturnDisposition = 'RESELLABLE' | 'DAMAGED';

export interface StockReservation {
  id: string;
  variantId: string;
  warehouseId: string;
  cartId: string;
  quantity: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  confirmedAt: string | null;
  releasedAt: string | null;
}

const WAREHOUSES_KEY = 'warehouses';
const STOCK_KEY = 'stock';
const RESERVATIONS_KEY = 'stock-reservations';

export function useWarehousesQuery() {
  return useQuery({
    queryKey: [WAREHOUSES_KEY],
    queryFn: () => apiFetch<Warehouse[]>('/inventory/warehouses'),
  });
}

export function useCreateWarehouseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: WarehouseFormValues) =>
      apiFetch<Warehouse>('/inventory/warehouses', { method: 'POST', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [WAREHOUSES_KEY] }),
  });
}

export function useUpdateWarehouseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: { name: string; code: string } }) =>
      apiFetch<Warehouse>(`/inventory/warehouses/${id}`, { method: 'PATCH', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [WAREHOUSES_KEY] }),
  });
}

export function useVariantStockQuery(variantId: string, warehouseId?: string) {
  return useQuery({
    queryKey: [STOCK_KEY, variantId, warehouseId],
    queryFn: () =>
      apiFetch<VariantStock & { variantId: string }>(
        `/inventory/stock/${variantId}${buildQueryString({ warehouseId })}`,
      ),
    enabled: Boolean(variantId),
  });
}

export function useVariantMovementsQuery(variantId: string) {
  return useQuery({
    queryKey: [STOCK_KEY, variantId, 'movements'],
    queryFn: () => apiFetch<StockMovement[]>(`/inventory/stock/${variantId}/movements`),
    enabled: Boolean(variantId),
  });
}

export function useLowStockQuery(warehouseId?: string) {
  return useQuery({
    queryKey: [STOCK_KEY, 'low-stock', warehouseId],
    queryFn: () => apiFetch<VariantStock[]>(`/inventory/stock/low-stock${buildQueryString({ warehouseId })}`),
  });
}

function invalidateStock(queryClient: ReturnType<typeof useQueryClient>, variantId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [STOCK_KEY, variantId] }),
    queryClient.invalidateQueries({ queryKey: [STOCK_KEY, 'low-stock'] }),
  ]);
}

export function useReceiveStockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { variantId: string; warehouseId?: string; quantity: number; note?: string }) =>
      apiFetch('/inventory/stock/receive', { method: 'POST', body: values }),
    onSuccess: (_, { variantId }) => invalidateStock(queryClient, variantId),
  });
}

export function useAdjustStockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: {
      variantId: string;
      warehouseId?: string;
      quantity: number;
      reason: AdjustReason;
      note?: string;
    }) => apiFetch('/inventory/stock/adjust', { method: 'POST', body: values }),
    onSuccess: (_, { variantId }) => invalidateStock(queryClient, variantId),
  });
}

export function useReturnStockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: {
      variantId: string;
      warehouseId?: string;
      quantity: number;
      disposition: ReturnDisposition;
      note?: string;
    }) => apiFetch('/inventory/stock/return', { method: 'POST', body: values }),
    onSuccess: (_, { variantId }) => invalidateStock(queryClient, variantId),
  });
}

export function useSetLowStockThresholdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { variantId: string; warehouseId?: string; threshold: number | null }) =>
      apiFetch(`/inventory/stock/${values.variantId}/threshold`, { method: 'PUT', body: values }),
    onSuccess: (_, { variantId }) => invalidateStock(queryClient, variantId),
  });
}

export function useStockReservationQuery(id: string, enabled: boolean) {
  return useQuery({
    queryKey: [RESERVATIONS_KEY, id],
    queryFn: () => apiFetch<StockReservation>(`/inventory/stock-reservations/${id}`),
    enabled,
  });
}

export function useConfirmReservationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<StockReservation>(`/inventory/stock-reservations/${id}/confirm`, { method: 'POST' }),
    onSuccess: (_, id) => queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY, id] }),
  });
}

export function useReleaseReservationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<StockReservation>(`/inventory/stock-reservations/${id}/release`, { method: 'POST' }),
    onSuccess: (_, id) => queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY, id] }),
  });
}

export function useExpireDueReservationsMutation() {
  return useMutation({
    mutationFn: () => apiFetch<{ expiredCount: number }>('/inventory/stock-reservations/expire-due', { method: 'POST' }),
  });
}
