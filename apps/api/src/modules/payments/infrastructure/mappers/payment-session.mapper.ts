import type { PaymentSession as PrismaPaymentSession } from '@prisma/client';
import { PaymentSession } from '../../domain/entities/payment-session.entity';

export class PaymentSessionMapper {
  static toDomain(this: void, record: PrismaPaymentSession): PaymentSession {
    return PaymentSession.reconstitute({
      id: record.id,
      storeId: record.storeId,
      provider: record.provider,
      status: record.status,
      providerSessionId: record.providerSessionId,
      pendingOrderSnapshot: record.pendingOrderSnapshot,
      orderId: record.orderId,
      amount: record.amount.toNumber(),
      currencyCode: record.currencyCode,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
