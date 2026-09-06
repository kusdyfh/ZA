import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import type { ProductReviews, Review } from './types';

const REVIEWS_KEY = 'reviews';

export function productReviewsQueryOptions(productId: string) {
  return {
    queryKey: [REVIEWS_KEY, productId],
    queryFn: () => apiFetch<ProductReviews>(`/catalog/products/${productId}/reviews`, { auth: false }),
  };
}

export function useProductReviewsQuery(productId: string) {
  return useQuery({ ...productReviewsQueryOptions(productId), enabled: Boolean(productId) });
}

export function useSubmitReviewMutation(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { rating: number; body?: string }) =>
      apiFetch<Review>(`/catalog/products/${productId}/reviews`, { method: 'POST', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [REVIEWS_KEY, productId] }),
  });
}
