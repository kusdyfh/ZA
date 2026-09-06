export const PAYMENT_TRANSACTION_TYPE = {
  AUTHORIZATION: 'AUTHORIZATION',
  CAPTURE: 'CAPTURE',
  REFUND: 'REFUND',
  FAILURE: 'FAILURE',
} as const;

export type PaymentTransactionTypeValue = (typeof PAYMENT_TRANSACTION_TYPE)[keyof typeof PAYMENT_TRANSACTION_TYPE];

export const PAYMENT_TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
} as const;

export type PaymentTransactionStatusValue =
  (typeof PAYMENT_TRANSACTION_STATUS)[keyof typeof PAYMENT_TRANSACTION_STATUS];
