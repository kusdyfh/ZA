'use client';

import { useState } from 'react';
import { Badge, DataTable, ErrorState, ForbiddenState, Switch, Tabs, useToast } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { ApiError } from '@/lib/api/client';
import {
  useNotificationHistoryQuery,
  useNotificationPreferencesQuery,
  useSetNotificationPreferenceMutation,
} from '@/features/notifications/api';
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_LABELS } from '@/features/notifications/types';
import type { Notification } from '@/features/notifications/types';

const STATUS_TONE: Record<Notification['status'], 'neutral' | 'success' | 'danger' | 'warning'> = {
  PENDING: 'neutral',
  SENT: 'success',
  FAILED: 'danger',
  SUPPRESSED: 'warning',
};

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

function PreferencesTab() {
  const { data: preferences, isLoading } = useNotificationPreferencesQuery();
  const setPreference = useSetNotificationPreferenceMutation();
  const { showToast } = useToast();

  function isEnabled(type: string): boolean {
    return preferences?.find((preference) => preference.type === type)?.enabled ?? true;
  }

  async function toggle(type: string, enabled: boolean) {
    try {
      await setPreference.mutateAsync({ type, channel: 'EMAIL', enabled });
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not update preference', description: describeError(error) });
    }
  }

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 py-6">
      {NOTIFICATION_TYPES.map((type) => (
        <div key={type} className="flex items-center justify-between rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{NOTIFICATION_TYPE_LABELS[type]}</span>
          <Switch checked={isEnabled(type)} onChange={(enabled) => toggle(type, enabled)} label={`Email for ${NOTIFICATION_TYPE_LABELS[type]}`} />
        </div>
      ))}
    </div>
  );
}

function HistoryTab() {
  const { data: notifications, isLoading } = useNotificationHistoryQuery();

  return (
    <div className="py-6">
      <DataTable
        columns={[
          { key: 'type', header: 'Type', render: (row: Notification) => NOTIFICATION_TYPE_LABELS[row.type] ?? row.type },
          { key: 'recipientEmail', header: 'Recipient', render: (row: Notification) => row.recipientEmail ?? '—' },
          { key: 'subject', header: 'Subject', render: (row: Notification) => row.subject },
          {
            key: 'status',
            header: 'Status',
            render: (row: Notification) => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>,
          },
          { key: 'createdAt', header: 'Sent', render: (row: Notification) => new Date(row.createdAt).toLocaleString() },
        ]}
        rows={notifications ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No notifications yet"
        emptyDescription="Order, review, and account notifications will show up here as they happen."
      />
    </div>
  );
}

export default function NotificationsPage() {
  const [tab, setTab] = useState<'history' | 'preferences'>('history');
  const historyQuery = useNotificationHistoryQuery();

  if (historyQuery.error instanceof ApiError && historyQuery.error.status === 403) {
    return (
      <div>
        <PageHeader title="Notifications" />
        <ForbiddenState />
      </div>
    );
  }

  if (historyQuery.isError) {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader title="Notifications" description="Every order, review, and account email the store has sent — and who receives which alerts." />
      <Tabs
        items={[
          { key: 'history', label: 'History' },
          { key: 'preferences', label: 'Preferences' },
        ]}
        activeKey={tab}
        onChange={(key) => setTab(key as 'history' | 'preferences')}
      />
      {tab === 'history' ? <HistoryTab /> : <PreferencesTab />}
    </div>
  );
}
