export const REFUND_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type RefundStatusValue = (typeof REFUND_STATUS)[keyof typeof REFUND_STATUS];

export const REFUND_METHOD = {
  STRIPE: 'STRIPE',
  STORE_CREDIT: 'STORE_CREDIT',
} as const;

export type RefundMethodValue = (typeof REFUND_METHOD)[keyof typeof REFUND_METHOD];
