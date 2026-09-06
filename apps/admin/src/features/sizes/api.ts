import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated, buildQueryString } from '@/lib/api/client';
import type { ListParams } from '@/lib/api/list-params';

export interface Size {
  id: string;
  label: string;
  sortOrder: number | null;
}

export interface SizeFormValues {
  label: string;
  sortOrder?: number;
}

const QUERY_KEY = 'sizes';

export function useSizesQuery(params: ListParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => apiFetchPaginated<Size>(`/catalog/sizes${buildQueryString(params)}`),
  });
}

export function useCreateSizeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: SizeFormValues) => apiFetch<Size>('/catalog/sizes', { method: 'POST', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateSizeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SizeFormValues }) =>
      apiFetch<Size>(`/catalog/sizes/${id}`, { method: 'PATCH', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteSizeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/catalog/sizes/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
