import type { ActorType } from '@za/types';
import type { RefundMethodValue, RefundStatusValue } from '../constants/refund-status.constants';

export interface RefundProps {
  id: string;
  storeId: string;
  orderId: string;
  paymentTransactionId: string | null;
  amount: number;
  reason: string;
  status: RefundStatusValue;
  method: RefundMethodValue;
  requestedByActorId: string | null;
  requestedByActorType: ActorType;
  completedAt: Date | null;
  createdAt: Date;
}

/**
 * `RefundPolicy.assertRefundable` requires the order be `CANCELLED` or
 * `RETURNED` (ADR 0026) — a refund is a consequence of cancellation/return
 * in this product's model, not an arbitrary balance adjustment.
 */
export class Refund {
  private constructor(private readonly props: RefundProps) {}

  static reconstitute(props: RefundProps): Refund {
    return new Refund(props);
  }

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get paymentTransactionId(): string | null {
    return this.props.paymentTransactionId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get reason(): string {
    return this.props.reason;
  }

  get status(): RefundStatusValue {
    return this.props.status;
  }

  get method(): RefundMethodValue {
    return this.props.method;
  }

  get requestedByActorId(): string | null {
    return this.props.requestedByActorId;
  }

  get requestedByActorType(): ActorType {
    return this.props.requestedByActorType;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toProps(): RefundProps {
    return { ...this.props };
  }
}
