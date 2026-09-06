import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated, buildQueryString } from '@/lib/api/client';
import type { ListParams } from '@/lib/api/list-params';
import type { AdminUser, AdminUserFormValues, Permission, Role } from './types';

export function useRolesQuery() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => apiFetch<Role[]>('/identity/roles'),
  });
}

export function useRolePermissionsQuery(roleId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['roles', roleId, 'permissions'],
    queryFn: () => apiFetch<{ role: Role; permissionKeys: string[] }>(`/identity/roles/${roleId}/permissions`),
    enabled,
  });
}

export function usePermissionsQuery() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiFetch<Permission[]>('/identity/permissions'),
  });
}

const ADMIN_USERS_KEY = 'admin-users';

export function useAdminUsersQuery(params: ListParams = {}) {
  return useQuery({
    queryKey: [ADMIN_USERS_KEY, params],
    queryFn: () => apiFetchPaginated<AdminUser>(`/identity/admin-users${buildQueryString(params)}`),
  });
}

export function useCreateAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: AdminUserFormValues) =>
      apiFetch<AdminUser>('/identity/admin-users', { method: 'POST', body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}

export function useActivateAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<AdminUser>(`/identity/admin-users/${id}/activate`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}

export function useDeactivateAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<AdminUser>(`/identity/admin-users/${id}/deactivate`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}

export function useUpdateAdminUserRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roleId }: { id: string; roleId: string }) =>
      apiFetch<AdminUser>(`/identity/admin-users/${id}/role`, { method: 'PATCH', body: { roleId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}
