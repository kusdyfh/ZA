import type { PaymentTransaction } from '../../domain/entities/payment-transaction.entity';

export class PaymentTransactionResponseDto {
  id!: string;
  orderId!: string | null;
  provider!: string;
  type!: string;
  status!: string;
  amount!: number;
  currencyCode!: string;
  providerReference!: string | null;
  failureReason!: string | null;
  createdAt!: Date;

  static fromDomain(this: void, transaction: PaymentTransaction): PaymentTransactionResponseDto {
    const dto = new PaymentTransactionResponseDto();
    dto.id = transaction.id;
    dto.orderId = transaction.orderId;
    dto.provider = transaction.provider;
    dto.type = transaction.type;
    dto.status = transaction.status;
    dto.amount = transaction.amount;
    dto.currencyCode = transaction.currencyCode;
    dto.providerReference = transaction.providerReference;
    dto.failureReason = transaction.failureReason;
    dto.createdAt = transaction.createdAt;
    return dto;
  }
}
