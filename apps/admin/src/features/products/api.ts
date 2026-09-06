import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated, buildQueryString } from '@/lib/api/client';
import type { ListParams } from '@/lib/api/list-params';
import type { Product, ProductFormValues, ProductStatus } from './types';

export interface ProductListParams extends ListParams {
  status?: ProductStatus;
  categoryId?: string;
  brandId?: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
}

const QUERY_KEY = 'products';

export function useProductsQuery(params: ProductListParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => apiFetchPaginated<Product>(`/catalog/products${buildQueryString(params)}`),
  });
}

export function useProductQuery(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => apiFetch<Product>(`/catalog/products/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ProductFormValues) =>
      apiFetch<Product>('/catalog/products', { method: 'POST', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProductFormValues }) =>
      apiFetch<Product>(`/catalog/products/${id}`, { method: 'PATCH', body: values }),
    onSuccess: (_, { id }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] }),
      ]),
  });
}

export function useChangeProductStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProductStatus }) =>
      apiFetch<Product>(`/catalog/products/${id}/status`, { method: 'PATCH', body: { status } }),
    onSuccess: (_, { id }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] }),
      ]),
  });
}

export function useSetProductTagsMutation() {
  return useMutation({
    mutationFn: ({ id, tagIds }: { id: string; tagIds: string[] }) =>
      apiFetch<void>(`/catalog/products/${id}/tags`, { method: 'PUT', body: { tagIds } }),
  });
}
