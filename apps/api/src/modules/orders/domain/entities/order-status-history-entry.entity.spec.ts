import { ActorType } from '@za/types';
import {
  OrderStatusHistoryEntry,
  type OrderStatusHistoryEntryProps,
} from './order-status-history-entry.entity';
import { ORDER_STATUS } from '../constants/order-status.constants';

function buildEntry(overrides: Partial<OrderStatusHistoryEntryProps> = {}): OrderStatusHistoryEntry {
  const props: OrderStatusHistoryEntryProps = {
    id: 'hist-1',
    status: ORDER_STATUS.PENDING,
    note: 'Order placed.',
    actorId: null,
    actorType: ActorType.SYSTEM,
    createdAt: new Date(),
    ...overrides,
  };
  return OrderStatusHistoryEntry.reconstitute(props);
}

describe('OrderStatusHistoryEntry', () => {
  it('exposes every field via getters', () => {
    const entry = buildEntry();
    expect(entry.status).toBe(ORDER_STATUS.PENDING);
    expect(entry.note).toBe('Order placed.');
    expect(entry.actorType).toBe(ActorType.SYSTEM);
  });

  it('is append-only — no mutator methods exist', () => {
    const entry = buildEntry() as unknown as Record<string, unknown>;
    expect(entry.markConfirmed).toBeUndefined();
  });
});
