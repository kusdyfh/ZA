import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated, buildQueryString } from '@/lib/api/client';
import type { ListParams } from '@/lib/api/list-params';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number | null;
  isActive: boolean;
  parentId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface CategoryFormValues {
  name: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  parentId?: string;
  metaTitle?: string;
  metaDescription?: string;
}

const QUERY_KEY = 'categories';

export function useCategoriesQuery(params: ListParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => apiFetchPaginated<Category>(`/catalog/categories${buildQueryString(params)}`),
  });
}

/** Unpaginated-ish (max page size) fetch for select dropdowns — the API has no true "all" endpoint. */
export function useAllCategoriesQuery() {
  return useQuery({
    queryKey: [QUERY_KEY, 'all'],
    queryFn: () => apiFetchPaginated<Category>(`/catalog/categories${buildQueryString({ limit: 100, sort: 'name:asc' })}`),
    staleTime: 60_000,
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CategoryFormValues) =>
      apiFetch<Category>('/catalog/categories', { method: 'POST', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CategoryFormValues }) =>
      apiFetch<Category>(`/catalog/categories/${id}`, { method: 'PATCH', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useSetCategoryActiveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiFetch<Category>(`/catalog/categories/${id}/active`, { method: 'PATCH', body: { isActive } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/catalog/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
