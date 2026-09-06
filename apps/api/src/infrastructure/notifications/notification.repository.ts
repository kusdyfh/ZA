import type { ActorType } from '@za/types';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export type NotificationChannelValue = 'EMAIL' | 'IN_APP';
export type NotificationStatusValue = 'PENDING' | 'SENT' | 'FAILED' | 'SUPPRESSED';

export interface CreateNotificationData {
  storeId: string;
  type: string;
  channel: NotificationChannelValue;
  recipientType: ActorType;
  recipientId?: string | null;
  recipientEmail?: string | null;
  subject: string;
  body: string;
  status: NotificationStatusValue;
}

export interface NotificationRecord extends CreateNotificationData {
  id: string;
  sentAt: Date | null;
  error: string | null;
  createdAt: Date;
}

export interface NotificationListFilters {
  recipientType?: ActorType;
  recipientId?: string;
}

/**
 * The Notification History table (ADR 0024) — a row is written for every
 * attempted notification, including ones a `NotificationPreference`
 * suppresses (`status: 'SUPPRESSED'`), so History reflects "this
 * happened" even when nothing was actually emailed. Lives under
 * `infrastructure/` (like `OUTBOX_REPOSITORY`) rather than inside
 * `modules/notifications/`, because `JobsModule`'s outbox-relay also
 * writes a system-alert row here directly on permanent outbox failure —
 * a `@Global` cross-cutting provider avoids a circular module
 * dependency between Jobs and Notifications.
 */
export interface NotificationRepository {
  create(data: CreateNotificationData): Promise<NotificationRecord>;
  markSent(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  list(storeId: string, filters?: NotificationListFilters): Promise<NotificationRecord[]>;
}
