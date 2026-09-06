import { ActorType } from '@za/types';
import { Refund, type RefundProps } from './refund.entity';
import { REFUND_METHOD, REFUND_STATUS } from '../constants/refund-status.constants';

function buildRefund(overrides: Partial<RefundProps> = {}): Refund {
  const props: RefundProps = {
    id: 'refund-1',
    storeId: 'store-1',
    orderId: 'order-1',
    paymentTransactionId: 'txn-1',
    amount: 5000,
    reason: 'Customer returned item',
    status: REFUND_STATUS.PENDING,
    method: REFUND_METHOD.STRIPE,
    requestedByActorId: 'admin-1',
    requestedByActorType: ActorType.ADMIN,
    completedAt: null,
    createdAt: new Date('2026-08-05T12:00:00Z'),
    ...overrides,
  };
  return Refund.reconstitute(props);
}

describe('Refund', () => {
  it('exposes every field via getters', () => {
    const refund = buildRefund();
    expect(refund.id).toBe('refund-1');
    expect(refund.storeId).toBe('store-1');
    expect(refund.orderId).toBe('order-1');
    expect(refund.paymentTransactionId).toBe('txn-1');
    expect(refund.amount).toBe(5000);
    expect(refund.reason).toBe('Customer returned item');
    expect(refund.status).toBe(REFUND_STATUS.PENDING);
    expect(refund.method).toBe(REFUND_METHOD.STRIPE);
    expect(refund.requestedByActorId).toBe('admin-1');
    expect(refund.requestedByActorType).toBe(ActorType.ADMIN);
    expect(refund.completedAt).toBeNull();
    expect(refund.createdAt).toEqual(new Date('2026-08-05T12:00:00Z'));
  });

  it('reflects a completed store-credit refund', () => {
    const completedAt = new Date('2026-08-05T13:00:00Z');
    const refund = buildRefund({
      status: REFUND_STATUS.COMPLETED,
      method: REFUND_METHOD.STORE_CREDIT,
      paymentTransactionId: null,
      completedAt,
    });
    expect(refund.status).toBe(REFUND_STATUS.COMPLETED);
    expect(refund.method).toBe(REFUND_METHOD.STORE_CREDIT);
    expect(refund.paymentTransactionId).toBeNull();
    expect(refund.completedAt).toEqual(completedAt);
  });

  it('toProps returns an equivalent plain object', () => {
    const props: RefundProps = {
      id: 'refund-2',
      storeId: 'store-1',
      orderId: 'order-2',
      paymentTransactionId: null,
      amount: 1000,
      reason: 'Damaged item',
      status: REFUND_STATUS.FAILED,
      method: REFUND_METHOD.STRIPE,
      requestedByActorId: null,
      requestedByActorType: ActorType.SYSTEM,
      completedAt: null,
      createdAt: new Date(),
    };
    const refund = Refund.reconstitute(props);
    expect(refund.toProps()).toEqual(props);
  });

  it('is immutable — no mutator methods exist', () => {
    const refund = buildRefund() as unknown as Record<string, unknown>;
    expect(refund.markCompleted).toBeUndefined();
    expect(refund.setStatus).toBeUndefined();
  });
});
