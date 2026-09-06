export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  /** COD's real starting state (Epic 12, ADR 0026) — cash not yet collected. */
  AWAITING_COLLECTION: 'AWAITING_COLLECTION',
  PAID: 'PAID',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
  REFUNDED: 'REFUNDED',
  FAILED: 'FAILED',
} as const;

export type PaymentStatusValue = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
