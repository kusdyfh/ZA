import type { StockReservation as StockReservationRecord } from '@prisma/client';
import { StockReservation } from '../../domain/entities/stock-reservation.entity';

export class StockReservationMapper {
  static toDomain(this: void, record: StockReservationRecord): StockReservation {
    return StockReservation.reconstitute({
      id: record.id,
      variantId: record.variantId,
      warehouseId: record.warehouseId,
      cartId: record.cartId,
      quantity: record.quantity,
      status: record.status,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      confirmedAt: record.confirmedAt,
      releasedAt: record.releasedAt,
    });
  }
}
