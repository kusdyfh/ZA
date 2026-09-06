import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated, buildQueryString } from '@/lib/api/client';
import type { ListParams } from '@/lib/api/list-params';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface BrandFormValues {
  name: string;
  slug?: string;
  description?: string;
}

const QUERY_KEY = 'brands';

export function useBrandsQuery(params: ListParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => apiFetchPaginated<Brand>(`/catalog/brands${buildQueryString(params)}`),
  });
}

export function useCreateBrandMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: BrandFormValues) => apiFetch<Brand>('/catalog/brands', { method: 'POST', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateBrandMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: BrandFormValues }) =>
      apiFetch<Brand>(`/catalog/brands/${id}`, { method: 'PATCH', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteBrandMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/catalog/brands/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
