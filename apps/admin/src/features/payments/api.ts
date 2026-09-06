import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import type { Order } from '@/features/orders/types';
import type { OrderPaymentSummary, Refund } from './types';

const QUERY_KEY = 'payment-summary';

export function useOrderPaymentSummaryQuery(orderId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, orderId],
    queryFn: () => apiFetch<OrderPaymentSummary>(`/payments/orders/${orderId}`),
    enabled: Boolean(orderId),
  });
}

export function useVerifyManualPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => apiFetch<Order>(`/payments/orders/${orderId}/verify-manual`, { method: 'POST' }),
    onSuccess: (_, orderId) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, orderId] }),
        queryClient.invalidateQueries({ queryKey: ['orders', orderId] }),
      ]),
  });
}

export function useIssueRefundMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, amount, reason }: { orderId: string; amount: number; reason: string }) =>
      apiFetch<Refund>('/payments/refunds', { method: 'POST', body: { orderId, amount, reason } }),
    onSuccess: (_, { orderId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, orderId] }),
        queryClient.invalidateQueries({ queryKey: ['orders', orderId] }),
      ]),
  });
}
