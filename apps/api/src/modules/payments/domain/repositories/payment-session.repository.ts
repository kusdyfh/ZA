import type { PaymentSession } from '../entities/payment-session.entity';
import type { PaymentProviderValue } from '../constants/payment-provider.constants';

export const PAYMENT_SESSION_REPOSITORY = Symbol('PAYMENT_SESSION_REPOSITORY');

export interface CreatePaymentSessionData {
  storeId: string;
  provider: PaymentProviderValue;
  providerSessionId?: string | null;
  pendingOrderSnapshot: unknown;
  amount: number;
  currencyCode: string;
  expiresAt: Date;
}

/**
 * `markSucceeded`/`markFailed` are the only paths that ever change
 * `status`/`orderId` after creation — both are idempotent (a duplicate
 * Stripe webhook retry is a no-op if the session is no longer `PENDING`),
 * enforced by the implementation checking status inside its own
 * transaction, mirroring `OrderRepository.changeStatus`'s pattern.
 */
export interface PaymentSessionRepository {
  create(data: CreatePaymentSessionData): Promise<PaymentSession>;
  findById(storeId: string, id: string): Promise<PaymentSession | null>;
  findByProviderSessionId(providerSessionId: string): Promise<PaymentSession | null>;
  markSucceeded(id: string, orderId: string): Promise<PaymentSession>;
  markFailed(id: string): Promise<PaymentSession>;
}
