import type { Refund as PrismaRefund } from '@prisma/client';
import type { ActorType } from '@za/types';
import { Refund } from '../../domain/entities/refund.entity';
import type { RefundMethodValue } from '../../domain/constants/refund-status.constants';

export class RefundMapper {
  static toDomain(this: void, record: PrismaRefund): Refund {
    return Refund.reconstitute({
      id: record.id,
      storeId: record.storeId,
      orderId: record.orderId,
      paymentTransactionId: record.paymentTransactionId,
      amount: record.amount.toNumber(),
      reason: record.reason,
      status: record.status,
      method: record.method as RefundMethodValue,
      requestedByActorId: record.requestedByActorId,
      requestedByActorType: record.requestedByActorType as ActorType,
      completedAt: record.completedAt,
      createdAt: record.createdAt,
    });
  }
}
