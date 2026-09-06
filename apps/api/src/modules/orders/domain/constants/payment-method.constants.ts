/**
 * Per docs/v2/adr/0015, CARD was schema-ready but not processable until
 * Epic 12 (ADR 0026) added a real Stripe integration — both values are now
 * fully processable end-to-end.
 */
export const PAYMENT_METHOD = {
  COD: 'COD',
  CARD: 'CARD',
} as const;

export type PaymentMethodValue = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];
