import type { OrderStatusHistory as OrderStatusHistoryRecord } from '@prisma/client';
import type { ActorType } from '@za/types';
import { OrderStatusHistoryEntry } from '../../domain/entities/order-status-history-entry.entity';

export class OrderStatusHistoryMapper {
  static toDomain(this: void, record: OrderStatusHistoryRecord): OrderStatusHistoryEntry {
    return OrderStatusHistoryEntry.reconstitute({
      id: record.id,
      status: record.status,
      note: record.note,
      actorId: record.actorId,
      actorType: record.actorType as ActorType,
      createdAt: record.createdAt,
    });
  }
}
