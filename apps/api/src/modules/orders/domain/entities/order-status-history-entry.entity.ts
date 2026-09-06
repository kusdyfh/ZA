import type { ActorType } from '@za/types';
import type { OrderStatusValue } from '../constants/order-status.constants';

export interface OrderStatusHistoryEntryProps {
  id: string;
  status: OrderStatusValue;
  note: string | null;
  actorId: string | null;
  actorType: ActorType;
  createdAt: Date;
}

/**
 * One row of the customer/staff-visible timeline — docs/product/07-ORDERS.md.
 * Append-only: once written, a history row is never edited, mirroring
 * Inventory's `StockMovement` immutability.
 */
export class OrderStatusHistoryEntry {
  private constructor(private readonly props: OrderStatusHistoryEntryProps) {}

  static reconstitute(props: OrderStatusHistoryEntryProps): OrderStatusHistoryEntry {
    return new OrderStatusHistoryEntry(props);
  }

  get id(): string {
    return this.props.id;
  }

  get status(): OrderStatusValue {
    return this.props.status;
  }

  get note(): string | null {
    return this.props.note;
  }

  get actorId(): string | null {
    return this.props.actorId;
  }

  get actorType(): ActorType {
    return this.props.actorType;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toProps(): OrderStatusHistoryEntryProps {
    return { ...this.props };
  }
}
