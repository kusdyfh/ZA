import { PaymentTransaction, type PaymentTransactionProps } from './payment-transaction.entity';
import { PAYMENT_PROVIDER } from '../constants/payment-provider.constants';
import { PAYMENT_TRANSACTION_STATUS, PAYMENT_TRANSACTION_TYPE } from '../constants/payment-transaction.constants';

function buildPaymentTransaction(overrides: Partial<PaymentTransactionProps> = {}): PaymentTransaction {
  const props: PaymentTransactionProps = {
    id: 'txn-1',
    storeId: 'store-1',
    paymentSessionId: 'session-1',
    orderId: 'order-1',
    provider: PAYMENT_PROVIDER.STRIPE,
    type: PAYMENT_TRANSACTION_TYPE.CAPTURE,
    status: PAYMENT_TRANSACTION_STATUS.SUCCEEDED,
    amount: 83000,
    currencyCode: 'IQD',
    providerReference: 'ch_123',
    failureReason: null,
    createdAt: new Date('2026-08-05T12:00:00Z'),
    ...overrides,
  };
  return PaymentTransaction.reconstitute(props);
}

describe('PaymentTransaction', () => {
  it('exposes every field via getters', () => {
    const txn = buildPaymentTransaction();
    expect(txn.id).toBe('txn-1');
    expect(txn.storeId).toBe('store-1');
    expect(txn.paymentSessionId).toBe('session-1');
    expect(txn.orderId).toBe('order-1');
    expect(txn.provider).toBe(PAYMENT_PROVIDER.STRIPE);
    expect(txn.type).toBe(PAYMENT_TRANSACTION_TYPE.CAPTURE);
    expect(txn.status).toBe(PAYMENT_TRANSACTION_STATUS.SUCCEEDED);
    expect(txn.amount).toBe(83000);
    expect(txn.currencyCode).toBe('IQD');
    expect(txn.providerReference).toBe('ch_123');
    expect(txn.failureReason).toBeNull();
    expect(txn.createdAt).toEqual(new Date('2026-08-05T12:00:00Z'));
  });

  it('reflects a failed transaction with a failure reason', () => {
    const txn = buildPaymentTransaction({
      type: PAYMENT_TRANSACTION_TYPE.FAILURE,
      status: PAYMENT_TRANSACTION_STATUS.FAILED,
      failureReason: 'card_declined',
      providerReference: null,
    });
    expect(txn.status).toBe(PAYMENT_TRANSACTION_STATUS.FAILED);
    expect(txn.failureReason).toBe('card_declined');
    expect(txn.providerReference).toBeNull();
  });

  it('allows a null paymentSessionId/orderId (e.g. COD capture without a card session)', () => {
    const txn = buildPaymentTransaction({ paymentSessionId: null });
    expect(txn.paymentSessionId).toBeNull();
  });

  it('toProps returns an equivalent plain object', () => {
    const props: PaymentTransactionProps = {
      id: 'txn-2',
      storeId: 'store-1',
      paymentSessionId: null,
      orderId: 'order-2',
      provider: PAYMENT_PROVIDER.COD,
      type: PAYMENT_TRANSACTION_TYPE.CAPTURE,
      status: PAYMENT_TRANSACTION_STATUS.SUCCEEDED,
      amount: 5000,
      currencyCode: 'IQD',
      providerReference: null,
      failureReason: null,
      createdAt: new Date(),
    };
    const txn = PaymentTransaction.reconstitute(props);
    expect(txn.toProps()).toEqual(props);
  });

  it('is immutable — no mutator methods exist, per the append-only ledger convention', () => {
    const txn = buildPaymentTransaction() as unknown as Record<string, unknown>;
    expect(txn.markFailed).toBeUndefined();
    expect(txn.update).toBeUndefined();
    expect(txn.setStatus).toBeUndefined();
  });
});
