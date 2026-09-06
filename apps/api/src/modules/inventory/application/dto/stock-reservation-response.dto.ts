import type { StockReservation } from '../../domain/entities/stock-reservation.entity';

export class StockReservationResponseDto {
  id!: string;
  variantId!: string;
  warehouseId!: string;
  cartId!: string;
  quantity!: number;
  status!: string;
  expiresAt!: Date;
  createdAt!: Date;
  confirmedAt!: Date | null;
  releasedAt!: Date | null;

  static fromDomain(reservation: StockReservation): StockReservationResponseDto {
    const dto = new StockReservationResponseDto();
    dto.id = reservation.id;
    dto.variantId = reservation.variantId;
    dto.warehouseId = reservation.warehouseId;
    dto.cartId = reservation.cartId;
    dto.quantity = reservation.quantity;
    dto.status = reservation.status;
    dto.expiresAt = reservation.expiresAt;
    dto.createdAt = reservation.createdAt;
    dto.confirmedAt = reservation.confirmedAt;
    dto.releasedAt = reservation.releasedAt;
    return dto;
  }
}
