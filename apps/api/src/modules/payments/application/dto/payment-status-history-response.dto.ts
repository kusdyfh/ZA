import type { PaymentStatusHistoryEntry } from '../../domain/entities/payment-status-history-entry.entity';

export class PaymentStatusHistoryResponseDto {
  id!: string;
  status!: string;
  note!: string | null;
  actorId!: string | null;
  actorType!: string;
  createdAt!: Date;

  static fromDomain(this: void, entry: PaymentStatusHistoryEntry): PaymentStatusHistoryResponseDto {
    const dto = new PaymentStatusHistoryResponseDto();
    dto.id = entry.id;
    dto.status = entry.status;
    dto.note = entry.note;
    dto.actorId = entry.actorId;
    dto.actorType = entry.actorType;
    dto.createdAt = entry.createdAt;
    return dto;
  }
}
