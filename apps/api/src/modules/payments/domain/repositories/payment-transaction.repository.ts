import type { PaymentTransaction } from '../entities/payment-transaction.entity';
import type { PaymentProviderValue } from '../constants/payment-provider.constants';
import type { PaymentTransactionStatusValue, PaymentTransactionTypeValue } from '../constants/payment-transaction.constants';

export const PAYMENT_TRANSACTION_REPOSITORY = Symbol('PAYMENT_TRANSACTION_REPOSITORY');

export interface CreatePaymentTransactionData {
  storeId: string;
  paymentSessionId?: string | null;
  orderId?: string | null;
  provider: PaymentProviderValue;
  type: PaymentTransactionTypeValue;
  status: PaymentTransactionStatusValue;
  amount: number;
  currencyCode: string;
  providerReference?: string | null;
  failureReason?: string | null;
}

/** Append-only — no update/delete method exists by design (see the entity's doc comment). */
export interface PaymentTransactionRepository {
  create(data: CreatePaymentTransactionData): Promise<PaymentTransaction>;
  listByOrderId(orderId: string): Promise<PaymentTransaction[]>;
}
