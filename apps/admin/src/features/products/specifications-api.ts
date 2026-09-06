import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

export interface ProductSpecification {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
}

export interface ProductSpecificationEntry {
  label: string;
  value: string;
}

const QUERY_KEY = 'product-specifications';

export function useProductSpecificationsQuery(productId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, productId],
    queryFn: () => apiFetch<ProductSpecification[]>(`/catalog/products/${productId}/specifications`, { auth: false }),
    enabled: Boolean(productId),
  });
}

export function useSetProductSpecificationsMutation(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (specifications: ProductSpecificationEntry[]) =>
      apiFetch<void>(`/catalog/products/${productId}/specifications`, {
        method: 'PUT',
        body: { specifications },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, productId] }),
  });
}
