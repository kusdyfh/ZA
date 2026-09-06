import type { ActorType } from '@za/types';
import type { OrderStatusHistoryEntry } from '../../domain/entities/order-status-history-entry.entity';

export class OrderStatusHistoryResponseDto {
  id!: string;
  status!: string;
  note!: string | null;
  actorId!: string | null;
  actorType!: ActorType;
  createdAt!: Date;

  static fromDomain(entry: OrderStatusHistoryEntry): OrderStatusHistoryResponseDto {
    const dto = new OrderStatusHistoryResponseDto();
    dto.id = entry.id;
    dto.status = entry.status;
    dto.note = entry.note;
    dto.actorId = entry.actorId;
    dto.actorType = entry.actorType;
    dto.createdAt = entry.createdAt;
    return dto;
  }
}
