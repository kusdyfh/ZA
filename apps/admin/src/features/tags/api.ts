import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated, buildQueryString } from '@/lib/api/client';
import type { ListParams } from '@/lib/api/list-params';

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface TagFormValues {
  name: string;
  slug?: string;
}

const QUERY_KEY = 'tags';

export function useTagsQuery(params: ListParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => apiFetchPaginated<Tag>(`/catalog/tags${buildQueryString(params)}`),
  });
}

export function useCreateTagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: TagFormValues) => apiFetch<Tag>('/catalog/tags', { method: 'POST', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateTagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TagFormValues }) =>
      apiFetch<Tag>(`/catalog/tags/${id}`, { method: 'PATCH', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteTagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/catalog/tags/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
