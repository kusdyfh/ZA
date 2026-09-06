import type { PaymentStatusHistory as PrismaPaymentStatusHistory } from '@prisma/client';
import type { ActorType } from '@za/types';
import { PaymentStatusHistoryEntry } from '../../domain/entities/payment-status-history-entry.entity';

export class PaymentStatusHistoryMapper {
  static toDomain(this: void, record: PrismaPaymentStatusHistory): PaymentStatusHistoryEntry {
    return PaymentStatusHistoryEntry.reconstitute({
      id: record.id,
      orderId: record.orderId,
      status: record.status,
      note: record.note,
      actorId: record.actorId,
      actorType: record.actorType as ActorType,
      createdAt: record.createdAt,
    });
  }
}
