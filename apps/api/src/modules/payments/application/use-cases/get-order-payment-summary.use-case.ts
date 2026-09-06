import { Inject, Injectable } from '@nestjs/common';
import { PaymentTransaction } from '../../domain/entities/payment-transaction.entity';
import { PaymentStatusHistoryEntry } from '../../domain/entities/payment-status-history-entry.entity';
import { Refund } from '../../domain/entities/refund.entity';
import {
  PAYMENT_TRANSACTION_REPOSITORY,
  type PaymentTransactionRepository,
} from '../../domain/repositories/payment-transaction.repository';
import {
  PAYMENT_STATUS_HISTORY_REPOSITORY,
  type PaymentStatusHistoryRepository,
} from '../../domain/repositories/payment-status-history.repository';
import { REFUND_REPOSITORY, type RefundRepository } from '../../domain/repositories/refund.repository';

export interface OrderPaymentSummary {
  transactions: PaymentTransaction[];
  statusHistory: PaymentStatusHistoryEntry[];
  refunds: Refund[];
}

/** Admin order-detail's Payment panel (ADR 0026) — one call, three ledgers. */
@Injectable()
export class GetOrderPaymentSummaryUseCase {
  constructor(
    @Inject(PAYMENT_TRANSACTION_REPOSITORY) private readonly paymentTransactions: PaymentTransactionRepository,
    @Inject(PAYMENT_STATUS_HISTORY_REPOSITORY) private readonly paymentStatusHistory: PaymentStatusHistoryRepository,
    @Inject(REFUND_REPOSITORY) private readonly refunds: RefundRepository,
  ) {}

  async execute(orderId: string): Promise<OrderPaymentSummary> {
    const [transactions, statusHistory, refunds] = await Promise.all([
      this.paymentTransactions.listByOrderId(orderId),
      this.paymentStatusHistory.listByOrderId(orderId),
      this.refunds.listByOrderId(orderId),
    ]);
    return { transactions, statusHistory, refunds };
  }
}
