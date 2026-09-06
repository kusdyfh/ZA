import { ActorType } from '@za/types';
import {
  PaymentStatusHistoryEntry,
  type PaymentStatusHistoryEntryProps,
} from './payment-status-history-entry.entity';
import { PAYMENT_STATUS } from '../../../orders/domain/constants/payment-status.constants';

function buildEntry(overrides: Partial<PaymentStatusHistoryEntryProps> = {}): PaymentStatusHistoryEntry {
  const props: PaymentStatusHistoryEntryProps = {
    id: 'hist-1',
    orderId: 'order-1',
    status: PAYMENT_STATUS.PAID,
    note: 'Card payment captured.',
    actorId: null,
    actorType: ActorType.SYSTEM,
    createdAt: new Date('2026-08-05T12:00:00Z'),
    ...overrides,
  };
  return PaymentStatusHistoryEntry.reconstitute(props);
}

describe('PaymentStatusHistoryEntry', () => {
  it('exposes every field via getters', () => {
    const entry = buildEntry();
    expect(entry.id).toBe('hist-1');
    expect(entry.orderId).toBe('order-1');
    expect(entry.status).toBe(PAYMENT_STATUS.PAID);
    expect(entry.note).toBe('Card payment captured.');
    expect(entry.actorId).toBeNull();
    expect(entry.actorType).toBe(ActorType.SYSTEM);
    expect(entry.createdAt).toEqual(new Date('2026-08-05T12:00:00Z'));
  });

  it('allows a null note and an admin actor', () => {
    const entry = buildEntry({ note: null, actorId: 'admin-1', actorType: ActorType.ADMIN });
    expect(entry.note).toBeNull();
    expect(entry.actorId).toBe('admin-1');
    expect(entry.actorType).toBe(ActorType.ADMIN);
  });

  it('toProps returns an equivalent plain object', () => {
    const props: PaymentStatusHistoryEntryProps = {
      id: 'hist-2',
      orderId: 'order-2',
      status: PAYMENT_STATUS.REFUNDED,
      note: null,
      actorId: 'admin-2',
      actorType: ActorType.ADMIN,
      createdAt: new Date(),
    };
    const entry = PaymentStatusHistoryEntry.reconstitute(props);
    expect(entry.toProps()).toEqual(props);
  });

  it('is immutable — no mutator methods exist, per the append-only convention', () => {
    const entry = buildEntry() as unknown as Record<string, unknown>;
    expect(entry.update).toBeUndefined();
    expect(entry.setStatus).toBeUndefined();
  });
});
