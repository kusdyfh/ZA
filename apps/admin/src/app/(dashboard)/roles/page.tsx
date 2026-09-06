'use client';

import { useState } from 'react';
import { Badge, DataTable, Dialog, ErrorState, ForbiddenState } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { ApiError } from '@/lib/api/client';
import { useRolePermissionsQuery, useRolesQuery } from '@/features/identity/api';
import type { Role } from '@/features/identity/types';

export default function RolesPage() {
  const { data: roles, isLoading, isError, error } = useRolesQuery();
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const permissionsQuery = useRolePermissionsQuery(viewingRole?.id ?? '', viewingRole !== null);

  if (error instanceof ApiError && error.status === 403) {
    return (
      <div>
        <PageHeader title="Roles" />
        <ForbiddenState />
      </div>
    );
  }

  if (isError) {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader title="Roles" description="Roles are fixed by the platform — view each one's permission set here." />
      <DataTable
        columns={[
          { key: 'name', header: 'Name', render: (row: Role) => row.name },
          { key: 'key', header: 'Key', render: (row: Role) => <span className="font-mono text-xs">{row.key}</span> },
          { key: 'description', header: 'Description', render: (row: Role) => row.description ?? '—' },
          {
            key: 'isSystem',
            header: 'System role',
            render: (row: Role) => (row.isSystem ? <Badge tone="info">System</Badge> : null),
          },
        ]}
        rows={roles ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        onRowClick={(row) => setViewingRole(row)}
        emptyTitle="No roles"
      />

      <Dialog open={viewingRole !== null} onClose={() => setViewingRole(null)} title={`${viewingRole?.name} permissions`} size="lg">
        <div className="flex flex-wrap gap-2">
          {(permissionsQuery.data?.permissionKeys ?? []).map((key) => (
            <Badge key={key} tone="neutral">
              {key}
            </Badge>
          ))}
          {permissionsQuery.data?.permissionKeys.length === 0 && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">This role has no permissions.</p>
          )}
        </div>
      </Dialog>
    </div>
  );
}
