import type { OrderNote as OrderNoteRecord } from '@prisma/client';
import type { ActorType } from '@za/types';
import { OrderNote } from '../../domain/entities/order-note.entity';

export class OrderNoteMapper {
  static toDomain(this: void, record: OrderNoteRecord): OrderNote {
    return OrderNote.reconstitute({
      id: record.id,
      body: record.body,
      isInternal: record.isInternal,
      actorId: record.actorId,
      actorType: record.actorType as ActorType,
      createdAt: record.createdAt,
    });
  }
}
