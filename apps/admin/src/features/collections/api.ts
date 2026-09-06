import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import type { Product } from '@/features/products/types';

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  isCurrentlyLive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface CollectionFormValues {
  name?: string;
  slug?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  metaTitle?: string;
  metaDescription?: string;
}

const QUERY_KEY = 'collections';

/**
 * There is no "list all collections" or "get one by id" endpoint (a
 * disclosed API gap, ADR 0019 §4) — this page can only create new
 * collections and manage a specific one the admin already has the id
 * for. `useCollectionProductsQuery` doubles as an existence check: a
 * 404 means the id is wrong.
 */
export function useCollectionProductsQuery(collectionId: string, enabled: boolean) {
  return useQuery({
    queryKey: [QUERY_KEY, collectionId, 'products'],
    queryFn: () => apiFetch<Product[]>(`/catalog/collections/${collectionId}/products`, { auth: false }),
    enabled,
  });
}

export function useCreateCollectionMutation() {
  return useMutation({
    mutationFn: (values: CollectionFormValues) =>
      apiFetch<Collection>('/catalog/collections', { method: 'POST', body: values }),
  });
}

export function useUpdateCollectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CollectionFormValues }) =>
      apiFetch<Collection>(`/catalog/collections/${id}`, { method: 'PATCH', body: values }),
    onSuccess: (_, { id }) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] }),
  });
}

export function useSetCollectionActiveMutation() {
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiFetch<Collection>(`/catalog/collections/${id}/active`, { method: 'PATCH', body: { isActive } }),
  });
}

export function useSetCollectionProductsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, productIds }: { id: string; productIds: string[] }) =>
      apiFetch<void>(`/catalog/collections/${id}/products`, { method: 'PUT', body: { productIds } }),
    onSuccess: (_, { id }) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id, 'products'] }),
  });
}

export function useDeleteCollectionMutation() {
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/catalog/collections/${id}`, { method: 'DELETE' }),
  });
}
