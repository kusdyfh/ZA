import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated, buildQueryString } from '@/lib/api/client';
import type { ListParams } from '@/lib/api/list-params';
import type { Order, OrderStatus } from './types';

export interface OrderListParams extends ListParams {
  status?: OrderStatus;
}

const QUERY_KEY = 'orders';

export function useOrdersQuery(params: OrderListParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => apiFetchPaginated<Order>(`/orders${buildQueryString(params)}`),
  });
}

/** Used by the Dashboard to derive per-status counts from `meta.total` — no aggregate endpoint exists (ADR 0019 §4). */
export function useOrderCountByStatus(status?: OrderStatus) {
  return useQuery({
    queryKey: [QUERY_KEY, 'count', status],
    queryFn: () => apiFetchPaginated<Order>(`/orders${buildQueryString({ status, limit: 1 })}`),
  });
}

export function useOrderQuery(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => apiFetch<Order>(`/orders/${id}`),
    enabled: Boolean(id),
  });
}

export function useAdvanceOrderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: OrderStatus; note?: string }) =>
      apiFetch<Order>(`/orders/${id}/status`, { method: 'PATCH', body: { orderId: id, status, note } }),
    onSuccess: (_, { id }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] }),
      ]),
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch<Order>(`/orders/${id}/cancel`, { method: 'POST', body: { orderId: id, reason } }),
    onSuccess: (_, { id }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] }),
      ]),
  });
}

export function useAddOrderNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body, isInternal }: { id: string; body: string; isInternal?: boolean }) =>
      apiFetch<Order>(`/orders/${id}/notes`, { method: 'POST', body: { orderId: id, body, isInternal } }),
    onSuccess: (_, { id }) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] }),
  });
}
