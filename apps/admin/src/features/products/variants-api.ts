import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  colorId: string | null;
  sizeId: string | null;
  priceOverride: string | null;
}

export interface VariantFormValues {
  productId: string;
  sku: string;
  barcode?: string;
  colorId?: string;
  sizeId?: string;
  priceOverride?: number;
}

const QUERY_KEY = 'product-variants';

export function useProductVariantsQuery(productId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, productId],
    queryFn: () => apiFetch<ProductVariant[]>(`/catalog/product-variants/by-product/${productId}`),
    enabled: Boolean(productId),
  });
}

export function useCreateVariantMutation(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: VariantFormValues) =>
      apiFetch<ProductVariant>('/catalog/product-variants', { method: 'POST', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, productId] }),
  });
}

export function useUpdateVariantMutation(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Omit<VariantFormValues, 'productId'> }) =>
      apiFetch<ProductVariant>(`/catalog/product-variants/${id}`, { method: 'PATCH', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, productId] }),
  });
}

export function useDeleteVariantMutation(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/catalog/product-variants/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, productId] }),
  });
}
