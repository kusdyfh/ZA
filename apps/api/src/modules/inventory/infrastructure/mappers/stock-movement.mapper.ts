import type { StockMovement as StockMovementRecord } from '@prisma/client';
import type { ActorType } from '@za/types';
import { StockMovement } from '../../domain/entities/stock-movement.entity';

export class StockMovementMapper {
  /**
   * Prisma generates ActorType as a string-literal-union, not @za/types'
   * nominal enum — same cast confined to this one infrastructure
   * boundary as Epic 2's AdminUserMapper (see that file's doc comment).
   */
  static toDomain(this: void, record: StockMovementRecord): StockMovement {
    return StockMovement.reconstitute({
      id: record.id,
      variantId: record.variantId,
      warehouseId: record.warehouseId,
      type: record.type,
      quantity: record.quantity,
      resultingStock: record.resultingStock,
      reason: record.reason,
      note: record.note,
      actorId: record.actorId,
      actorType: record.actorType as ActorType,
      createdAt: record.createdAt,
    });
  }
}
