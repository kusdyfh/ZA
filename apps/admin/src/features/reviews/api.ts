import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import type { Review } from './types';

const QUERY_KEY = 'reviews-pending';

export function usePendingReviewsQuery() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => apiFetch<Review[]>('/reviews/pending'),
  });
}

export function useModerateReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve, rejectionReason }: { id: string; approve: boolean; rejectionReason?: string }) =>
      apiFetch<Review>(`/reviews/${id}/moderate`, { method: 'POST', body: { approve, rejectionReason } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
