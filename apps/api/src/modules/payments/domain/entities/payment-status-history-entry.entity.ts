import type { ActorType } from '@za/types';
import type { PaymentStatusValue } from '../../../orders/domain/constants/payment-status.constants';

export interface PaymentStatusHistoryEntryProps {
  id: string;
  orderId: string;
  status: PaymentStatusValue;
  note: string | null;
  actorId: string | null;
  actorType: ActorType;
  createdAt: Date;
}

/**
 * Payment status tracked separately from order status (docs/product
 * /12-PAYMENTS.md) — its own timeline, mirroring `OrderStatusHistoryEntry`
 * exactly. Immutable, append-only.
 */
export class PaymentStatusHistoryEntry {
  private constructor(private readonly props: PaymentStatusHistoryEntryProps) {}

  static reconstitute(props: PaymentStatusHistoryEntryProps): PaymentStatusHistoryEntry {
    return new PaymentStatusHistoryEntry(props);
  }

  get id(): string {
    return this.props.id;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get status(): PaymentStatusValue {
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

  toProps(): PaymentStatusHistoryEntryProps {
    return { ...this.props };
  }
}
