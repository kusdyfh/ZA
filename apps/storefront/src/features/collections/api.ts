import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import type { Product } from '@/features/products/types';
import type { Collection } from './types';

const COLLECTIONS_KEY = 'collections';

export function collectionsQueryOptions() {
  return {
    queryKey: [COLLECTIONS_KEY],
    queryFn: () => apiFetch<Collection[]>('/catalog/storefront/collections', { auth: false }),
  };
}

export function useCollectionsQuery() {
  return useQuery(collectionsQueryOptions());
}

export function collectionProductsQueryOptions(collectionId: string) {
  return {
    queryKey: [COLLECTIONS_KEY, collectionId, 'products'],
    queryFn: () => apiFetch<Product[]>(`/catalog/storefront/collections/${collectionId}/products`, { auth: false }),
  };
}

export function useCollectionProductsQuery(collectionId: string) {
  return useQuery({ ...collectionProductsQueryOptions(collectionId), enabled: Boolean(collectionId) });
}
