import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { useCustomerAuth } from '@/lib/auth/auth-context';
import type { WishlistEntry } from './types';

const WISHLIST_KEY = 'wishlist';

export function useWishlistQuery() {
  const { isAuthenticated } = useCustomerAuth();
  return useQuery({
    queryKey: [WISHLIST_KEY],
    queryFn: () => apiFetch<WishlistEntry[]>('/customers/me/wishlist'),
    enabled: isAuthenticated,
  });
}

export function useAddWishlistItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => apiFetch(`/customers/me/wishlist/${productId}`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [WISHLIST_KEY] }),
  });
}

export function useRemoveWishlistItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => apiFetch(`/customers/me/wishlist/${productId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [WISHLIST_KEY] }),
  });
}
