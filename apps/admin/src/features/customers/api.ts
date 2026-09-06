import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import type { Order } from '@/features/orders/types';
import type { Customer } from './types';

export function useCustomerQuery(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => apiFetch<Customer>(`/customers/${id}`),
    enabled,
  });
}

export function useCustomerOrdersQuery(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['customers', id, 'orders'],
    queryFn: () => apiFetch<Order[]>(`/customers/${id}/orders`),
    enabled,
  });
}
