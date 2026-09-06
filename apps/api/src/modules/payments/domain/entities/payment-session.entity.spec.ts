import { PaymentSession, type PaymentSessionProps } from './payment-session.entity';
import { PAYMENT_PROVIDER } from '../constants/payment-provider.constants';
import { PAYMENT_SESSION_STATUS } from '../constants/payment-session-status.constants';

function buildPaymentSession(overrides: Partial<PaymentSessionProps> = {}): PaymentSession {
  const props: PaymentSessionProps = {
    id: 'session-1',
    storeId: 'store-1',
    provider: PAYMENT_PROVIDER.STRIPE,
    status: PAYMENT_SESSION_STATUS.PENDING,
    providerSessionId: 'pi_123',
    pendingOrderSnapshot: { customerNameSnapshot: 'Demo Customer' },
    orderId: null,
    amount: 83000,
    currencyCode: 'IQD',
    expiresAt: new Date('2026-08-05T13:00:00Z'),
    createdAt: new Date('2026-08-05T12:00:00Z'),
    updatedAt: new Date('2026-08-05T12:00:00Z'),
    ...overrides,
  };
  return PaymentSession.reconstitute(props);
}

describe('PaymentSession', () => {
  it('exposes every field via getters', () => {
    const session = buildPaymentSession();
    expect(session.id).toBe('session-1');
    expect(session.storeId).toBe('store-1');
    expect(session.provider).toBe(PAYMENT_PROVIDER.STRIPE);
    expect(session.status).toBe(PAYMENT_SESSION_STATUS.PENDING);
    expect(session.providerSessionId).toBe('pi_123');
    expect(session.pendingOrderSnapshot).toEqual({ customerNameSnapshot: 'Demo Customer' });
    expect(session.orderId).toBeNull();
    expect(session.amount).toBe(83000);
    expect(session.currencyCode).toBe('IQD');
    expect(session.expiresAt).toEqual(new Date('2026-08-05T13:00:00Z'));
    expect(session.createdAt).toEqual(new Date('2026-08-05T12:00:00Z'));
    expect(session.updatedAt).toEqual(new Date('2026-08-05T12:00:00Z'));
  });

  it('reflects a resolved session (orderId set, status succeeded)', () => {
    const session = buildPaymentSession({ status: PAYMENT_SESSION_STATUS.SUCCEEDED, orderId: 'order-1' });
    expect(session.status).toBe(PAYMENT_SESSION_STATUS.SUCCEEDED);
    expect(session.orderId).toBe('order-1');
  });

  it('toProps returns an equivalent plain object', () => {
    const props: PaymentSessionProps = {
      id: 'session-1',
      storeId: 'store-1',
      provider: PAYMENT_PROVIDER.COD,
      status: PAYMENT_SESSION_STATUS.PENDING,
      providerSessionId: null,
      pendingOrderSnapshot: null,
      orderId: null,
      amount: 1000,
      currencyCode: 'IQD',
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const session = PaymentSession.reconstitute(props);
    expect(session.toProps()).toEqual(props);
  });

  it('is immutable — no mutator methods exist', () => {
    const session = buildPaymentSession() as unknown as Record<string, unknown>;
    expect(session.markSucceeded).toBeUndefined();
    expect(session.markFailed).toBeUndefined();
    expect(session.setStatus).toBeUndefined();
  });
});
