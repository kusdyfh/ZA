export interface Notification {
  id: string;
  type: string;
  channel: string;
  recipientType: 'ADMIN' | 'CUSTOMER' | 'SYSTEM';
  recipientId: string | null;
  recipientEmail: string | null;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SUPPRESSED';
  sentAt: string | null;
  error: string | null;
  createdAt: string;
}

export interface NotificationPreference {
  type: string;
  channel: string;
  enabled: boolean;
}

export const NOTIFICATION_TYPES = [
  'ORDER_PLACED_ADMIN_ALERT',
  'REVIEW_SUBMITTED_ADMIN_ALERT',
  'ORDER_STATUS_CHANGED_CUSTOMER',
  'WELCOME_CUSTOMER',
  'PASSWORD_RESET_REQUESTED',
] as const;

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  ORDER_PLACED_ADMIN_ALERT: 'New order alert',
  REVIEW_SUBMITTED_ADMIN_ALERT: 'New review awaiting moderation',
  ORDER_STATUS_CHANGED_CUSTOMER: 'Order status changed (customer)',
  WELCOME_CUSTOMER: 'Welcome email (customer)',
  PASSWORD_RESET_REQUESTED: 'Password reset requested',
};
