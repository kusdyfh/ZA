import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated, buildQueryString } from '@/lib/api/client';
import type { ListParams } from '@/lib/api/list-params';

export interface Color {
  id: string;
  name: string;
  hexCode: string;
}

export interface ColorFormValues {
  name: string;
  hexCode: string;
}

const QUERY_KEY = 'colors';

export function useColorsQuery(params: ListParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => apiFetchPaginated<Color>(`/catalog/colors${buildQueryString(params)}`),
  });
}

export function useCreateColorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ColorFormValues) => apiFetch<Color>('/catalog/colors', { method: 'POST', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateColorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ColorFormValues }) =>
      apiFetch<Color>(`/catalog/colors/${id}`, { method: 'PATCH', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteColorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/catalog/colors/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
