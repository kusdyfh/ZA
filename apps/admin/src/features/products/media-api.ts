import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

export interface ProductMedia {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  altText: string | null;
  sortOrder: number;
  isCover: boolean;
}

export interface ProductMediaEntry {
  type: 'IMAGE' | 'VIDEO';
  url: string;
  altText?: string;
  isCover: boolean;
}

const QUERY_KEY = 'product-media';

export function useProductMediaQuery(productId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, productId],
    queryFn: () => apiFetch<ProductMedia[]>(`/catalog/products/${productId}/media`, { auth: false }),
    enabled: Boolean(productId),
  });
}

export function useSetProductMediaMutation(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (media: ProductMediaEntry[]) =>
      apiFetch<void>(`/catalog/products/${productId}/media`, { method: 'PUT', body: { media } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, productId] }),
  });
}
