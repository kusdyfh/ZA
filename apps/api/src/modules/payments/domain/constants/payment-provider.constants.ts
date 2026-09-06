export const PAYMENT_PROVIDER = {
  COD: 'COD',
  STRIPE: 'STRIPE',
  MANUAL: 'MANUAL',
} as const;

export type PaymentProviderValue = (typeof PAYMENT_PROVIDER)[keyof typeof PAYMENT_PROVIDER];
