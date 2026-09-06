import { useQuery } from '@tanstack/react-query';
import { apiFetchPaginated } from '@/lib/api/client';
import type { Order } from '@/features/orders/types';

/**
 * No dashboard/analytics/stats endpoint exists (ADR 0019 §4) — each
 * stat is a separate lightweight list request, reading `meta.total`
 * (or array length for the two non-paginated endpoints) instead of one
 * aggregate query the backend doesn't offer.
 */
export function useOrderTotalQuery() {
  return useQuery({
    queryKey: ['dashboard', 'orders-total'],
    queryFn: () => apiFetchPaginated<Order>('/orders?limit=1'),
  });
}

export function usePendingOrderTotalQuery() {
  return useQuery({
    queryKey: ['dashboard', 'orders-pending-total'],
    queryFn: () => apiFetchPaginated<Order>('/orders?status=PENDING&limit=1'),
  });
}

export function useRecentOrdersQuery() {
  return useQuery({
    queryKey: ['dashboard', 'recent-orders'],
    queryFn: () => apiFetchPaginated<Order>('/orders?limit=5&sort=createdAt:desc'),
  });
}
