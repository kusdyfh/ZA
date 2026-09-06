import type { PaymentProviderValue } from '../constants/payment-provider.constants';

export const PAYMENT_PROVIDER_REGISTRY = Symbol('PAYMENT_PROVIDER_REGISTRY');

export interface CreatePaymentSessionInput {
  amount: number;
  currencyCode: string;
  orderNumber: string;
  customerEmail: string;
  /** Where the provider should send the customer back after payment (Stripe's success_url/cancel_url). */
  successUrl: string;
  cancelUrl: string;
}

export interface CreatePaymentSessionResult {
  /** COD/MANUAL never redirect — `requiresRedirect: false`, `checkoutUrl: null`. */
  requiresRedirect: boolean;
  checkoutUrl: string | null;
  providerSessionId: string | null;
}

export interface PaymentWebhookEvent {
  type: string;
  providerSessionId: string | null;
  providerReference: string | null;
  /** Raw amount in the provider's smallest currency unit conversion already normalized to this store's currency. */
  amount: number | null;
}

export interface RefundInput {
  providerReference: string;
  amount: number;
  currencyCode: string;
}

export interface RefundResult {
  succeeded: boolean;
  providerReference: string | null;
  /** True for COD/MANUAL — there is no electronic transaction to reverse; staff must settle it out of band (docs/product/12-PAYMENTS.md). */
  requiresManualFollowUp: boolean;
}

/**
 * Provider abstraction (ADR 0026) — `CodPaymentProvider`/
 * `StripePaymentProvider`/`ManualPaymentProvider` each implement this,
 * selected via `PAYMENT_PROVIDER_REGISTRY` (a provider-keyed map, not a
 * single injected instance) rather than a new pattern per provider.
 */
export interface PaymentProviderPort {
  readonly provider: PaymentProviderValue;
  createSession(input: CreatePaymentSessionInput): Promise<CreatePaymentSessionResult>;
  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean;
  parseWebhookEvent(rawBody: Buffer): PaymentWebhookEvent;
  refund(input: RefundInput): Promise<RefundResult>;
}

export type PaymentProviderRegistry = ReadonlyMap<PaymentProviderValue, PaymentProviderPort>;
