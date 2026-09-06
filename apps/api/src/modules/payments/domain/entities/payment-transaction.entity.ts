import type { PaymentProviderValue } from '../constants/payment-provider.constants';
import type { PaymentTransactionStatusValue, PaymentTransactionTypeValue } from '../constants/payment-transaction.constants';

export interface PaymentTransactionProps {
  id: string;
  storeId: string;
  paymentSessionId: string | null;
  orderId: string | null;
  provider: PaymentProviderValue;
  type: PaymentTransactionTypeValue;
  status: PaymentTransactionStatusValue;
  amount: number;
  currencyCode: string;
  providerReference: string | null;
  failureReason: string | null;
  createdAt: Date;
}

/**
 * An append-only ledger row (ADR 0026) — a COD capture, a Stripe capture, a
 * failed webhook, a refund. Never updated once written; a correction is a
 * new row, mirroring `OrderStatusHistory`'s immutability convention.
 */
export class PaymentTransaction {
  private constructor(private readonly props: PaymentTransactionProps) {}

  static reconstitute(props: PaymentTransactionProps): PaymentTransaction {
    return new PaymentTransaction(props);
  }

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get paymentSessionId(): string | null {
    return this.props.paymentSessionId;
  }

  get orderId(): string | null {
    return this.props.orderId;
  }

  get provider(): PaymentProviderValue {
    return this.props.provider;
  }

  get type(): PaymentTransactionTypeValue {
    return this.props.type;
  }

  get status(): PaymentTransactionStatusValue {
    return this.props.status;
  }

  get amount(): number {
    return this.props.amount;
  }

  get currencyCode(): string {
    return this.props.currencyCode;
  }

  get providerReference(): string | null {
    return this.props.providerReference;
  }

  get failureReason(): string | null {
    return this.props.failureReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toProps(): PaymentTransactionProps {
    return { ...this.props };
  }
}
