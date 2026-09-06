import type { PaymentTransaction as PrismaPaymentTransaction } from '@prisma/client';
import { PaymentTransaction } from '../../domain/entities/payment-transaction.entity';

export class PaymentTransactionMapper {
  static toDomain(this: void, record: PrismaPaymentTransaction): PaymentTransaction {
    return PaymentTransaction.reconstitute({
      id: record.id,
      storeId: record.storeId,
      paymentSessionId: record.paymentSessionId,
      orderId: record.orderId,
      provider: record.provider,
      type: record.type,
      status: record.status,
      amount: record.amount.toNumber(),
      currencyCode: record.currencyCode,
      providerReference: record.providerReference,
      failureReason: record.failureReason,
      createdAt: record.createdAt,
    });
  }
}
