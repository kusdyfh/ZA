'use client';

import { Badge, DataTable, ErrorState, ForbiddenState } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { ApiError } from '@/lib/api/client';
import { usePermissionsQuery } from '@/features/identity/api';
import type { Permission } from '@/features/identity/types';

/**
 * A handful of seeded permission keys (coupons.*, content.manage,
 * analytics.view, settings.manage, audit_log.view) have no backing
 * route in this API version yet (ADR 0019 §4) — flagged rather than
 * silently offered as if they gated a real feature.
 */
const UNENFORCED_KEYS = new Set([
  'coupons.view',
  'coupons.manage',
  'content.manage',
  'analytics.view',
  'settings.manage',
  'audit_log.view',
]);

export default function PermissionsPage() {
  const { data: permissions, isLoading, isError, error } = usePermissionsQuery();

  if (error instanceof ApiError && error.status === 403) {
    return (
      <div>
        <PageHeader title="Permissions" />
        <ForbiddenState />
      </div>
    );
  }

  if (isError) {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader title="Permissions" description="The full permission catalog — assigned to roles, not editable here." />
      <DataTable
        columns={[
          { key: 'key', header: 'Key', render: (row: Permission) => <span className="font-mono text-xs">{row.key}</span> },
          { key: 'module', header: 'Module', render: (row: Permission) => row.module },
          { key: 'action', header: 'Action', render: (row: Permission) => row.action },
          {
            key: 'status',
            header: 'Status',
            render: (row: Permission) =>
              UNENFORCED_KEYS.has(row.key) ? (
                <Badge tone="neutral">No backing feature yet</Badge>
              ) : (
                <Badge tone="success">Active</Badge>
              ),
          },
        ]}
        rows={permissions ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No permissions"
      />
    </div>
  );
}
