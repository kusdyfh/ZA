import type { PaymentProviderValue } from '../constants/payment-provider.constants';
import type { PaymentSessionStatusValue } from '../constants/payment-session-status.constants';

export interface PaymentSessionProps {
  id: string;
  storeId: string;
  provider: PaymentProviderValue;
  status: PaymentSessionStatusValue;
  providerSessionId: string | null;
  pendingOrderSnapshot: unknown;
  orderId: string | null;
  amount: number;
  currencyCode: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Reifies "a pending checkout" for card payments (ADR 0026) — no
 * `Order`/`OrderItem` exists until `ConfirmCardPaymentUseCase` materializes
 * them from `pendingOrderSnapshot`. Immutable/reconstitute-only, mirroring
 * `Order`'s own convention — the repository (`markSucceeded`/`markFailed`)
 * is the only place `status`/`orderId` ever change.
 */
export class PaymentSession {
  private constructor(private readonly props: PaymentSessionProps) {}

  static reconstitute(props: PaymentSessionProps): PaymentSession {
    return new PaymentSession(props);
  }

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get provider(): PaymentProviderValue {
    return this.props.provider;
  }

  get status(): PaymentSessionStatusValue {
    return this.props.status;
  }

  get providerSessionId(): string | null {
    return this.props.providerSessionId;
  }

  get pendingOrderSnapshot(): unknown {
    return this.props.pendingOrderSnapshot;
  }

  get orderId(): string | null {
    return this.props.orderId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get currencyCode(): string {
    return this.props.currencyCode;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toProps(): PaymentSessionProps {
    return { ...this.props };
  }
}
