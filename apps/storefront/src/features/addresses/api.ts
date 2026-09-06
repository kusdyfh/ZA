import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { useCustomerAuth } from '@/lib/auth/auth-context';
import type { Address, AddressFormValues } from './types';

const ADDRESSES_KEY = 'addresses';

export function useAddressesQuery() {
  const { isAuthenticated } = useCustomerAuth();
  return useQuery({
    queryKey: [ADDRESSES_KEY],
    queryFn: () => apiFetch<Address[]>('/customers/me/addresses'),
    enabled: isAuthenticated,
  });
}

export function useCreateAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: AddressFormValues) => apiFetch<Address>('/customers/me/addresses', { method: 'POST', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADDRESSES_KEY] }),
  });
}

export function useUpdateAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AddressFormValues }) =>
      apiFetch<Address>(`/customers/me/addresses/${id}`, { method: 'PATCH', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADDRESSES_KEY] }),
  });
}

export function useDeleteAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/customers/me/addresses/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADDRESSES_KEY] }),
  });
}
