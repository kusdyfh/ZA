export const PAYMENT_SESSION_STATUS = {
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
} as const;

export type PaymentSessionStatusValue = (typeof PAYMENT_SESSION_STATUS)[keyof typeof PAYMENT_SESSION_STATUS];
