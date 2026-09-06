import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import type { Notification, NotificationPreference } from './types';

const HISTORY_KEY = 'notifications-history';
const PREFERENCES_KEY = 'notifications-preferences';

export function useNotificationHistoryQuery() {
  return useQuery({
    queryKey: [HISTORY_KEY],
    queryFn: () => apiFetch<Notification[]>('/notifications'),
  });
}

export function useNotificationPreferencesQuery() {
  return useQuery({
    queryKey: [PREFERENCES_KEY],
    queryFn: () => apiFetch<NotificationPreference[]>('/notifications/preferences'),
  });
}

export function useSetNotificationPreferenceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { type: string; channel: 'EMAIL'; enabled: boolean }) =>
      apiFetch('/notifications/preferences', { method: 'PATCH', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PREFERENCES_KEY] }),
  });
}
