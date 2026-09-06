import type { ActorType } from '@za/types';
import type { OrderNote } from '../../domain/entities/order-note.entity';

export class OrderNoteResponseDto {
  id!: string;
  body!: string;
  isInternal!: boolean;
  actorId!: string | null;
  actorType!: ActorType;
  createdAt!: Date;

  static fromDomain(note: OrderNote): OrderNoteResponseDto {
    const dto = new OrderNoteResponseDto();
    dto.id = note.id;
    dto.body = note.body;
    dto.isInternal = note.isInternal;
    dto.actorId = note.actorId;
    dto.actorType = note.actorType;
    dto.createdAt = note.createdAt;
    return dto;
  }
}
