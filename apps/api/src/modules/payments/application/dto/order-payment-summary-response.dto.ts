import type { OrderPaymentSummary } from '../use-cases/get-order-payment-summary.use-case';
import { PaymentTransactionResponseDto } from './payment-transaction-response.dto';
import { PaymentStatusHistoryResponseDto } from './payment-status-history-response.dto';
import { RefundResponseDto } from './refund-response.dto';

export class OrderPaymentSummaryResponseDto {
  transactions!: PaymentTransactionResponseDto[];
  statusHistory!: PaymentStatusHistoryResponseDto[];
  refunds!: RefundResponseDto[];

  static fromDomain(this: void, summary: OrderPaymentSummary): OrderPaymentSummaryResponseDto {
    const dto = new OrderPaymentSummaryResponseDto();
    dto.transactions = summary.transactions.map(PaymentTransactionResponseDto.fromDomain);
    dto.statusHistory = summary.statusHistory.map(PaymentStatusHistoryResponseDto.fromDomain);
    dto.refunds = summary.refunds.map(RefundResponseDto.fromDomain);
    return dto;
  }
}
