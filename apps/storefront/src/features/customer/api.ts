import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import type { StoredCustomer } from '@/lib/auth/token-storage';

export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  phone?: string;
  marketingOptIn: boolean;
}

export function useUpdateProfileMutation() {
  return useMutation({
    mutationFn: (values: UpdateProfileInput) => apiFetch<StoredCustomer>('/customers/me', { method: 'PATCH', body: values }),
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (values: { currentPassword: string; newPassword: string }) =>
      apiFetch('/customers/me/change-password', { method: 'POST', body: values }),
  });
}
