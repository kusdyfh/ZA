/**
 * One notification `type` per wired domain event (ADR 0023/0024) plus
 * `SYSTEM_OUTBOX_FAILURE` (written directly by `JobsModule`'s outbox
 * relay, not via the queue pipeline below). This is the same string
 * space `NotificationPreference.type` is keyed on.
 */
export const NOTIFICATION_TYPES = {
  ORDER_PLACED_ADMIN_ALERT: 'ORDER_PLACED_ADMIN_ALERT',
  ORDER_STATUS_CHANGED_CUSTOMER: 'ORDER_STATUS_CHANGED_CUSTOMER',
  WELCOME_CUSTOMER: 'WELCOME_CUSTOMER',
  REVIEW_SUBMITTED_ADMIN_ALERT: 'REVIEW_SUBMITTED_ADMIN_ALERT',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  SYSTEM_OUTBOX_FAILURE: 'SYSTEM_OUTBOX_FAILURE',
  // Epic 12 (Payments & Shipping) — ADR 0026/0027. PAYMENT_FAILED has no
  // customer notification (nothing happened from their perspective, per
  // docs/product/07-ORDERS.md), so it has no type here.
  PAYMENT_CAPTURED_CUSTOMER: 'PAYMENT_CAPTURED_CUSTOMER',
  PAYMENT_REFUNDED_CUSTOMER: 'PAYMENT_REFUNDED_CUSTOMER',
  SHIPMENT_DISPATCHED_CUSTOMER: 'SHIPMENT_DISPATCHED_CUSTOMER',
  SHIPMENT_DELIVERED_CUSTOMER: 'SHIPMENT_DELIVERED_CUSTOMER',
} as const;

export type NotificationTypeValue = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
