import type { StockMovement } from '../../domain/entities/stock-movement.entity';

export class StockMovementResponseDto {
  id!: string;
  variantId!: string;
  warehouseId!: string;
  type!: string;
  quantity!: number;
  resultingStock!: number;
  reason!: string | null;
  note!: string | null;
  actorId!: string | null;
  actorType!: string;
  createdAt!: Date;

  static fromDomain(movement: StockMovement): StockMovementResponseDto {
    const dto = new StockMovementResponseDto();
    dto.id = movement.id;
    dto.variantId = movement.variantId;
    dto.warehouseId = movement.warehouseId;
    dto.type = movement.type;
    dto.quantity = movement.quantity;
    dto.resultingStock = movement.resultingStock;
    dto.reason = movement.reason;
    dto.note = movement.note;
    dto.actorId = movement.actorId;
    dto.actorType = movement.actorType;
    dto.createdAt = movement.createdAt;
    return dto;
  }
}
