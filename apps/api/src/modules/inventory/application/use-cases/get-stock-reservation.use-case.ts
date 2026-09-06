import { Inject, Injectable } from '@nestjs/common';
import { StockReservation } from '../../domain/entities/stock-reservation.entity';
import {
  STOCK_RESERVATION_REPOSITORY,
  type StockReservationRepository,
} from '../../domain/repositories/stock-reservation.repository';
import { StockReservationNotFoundError } from '../../domain/errors/inventory.errors';

export interface GetStockReservationInput {
  reservationId: string;
}

/**
 * Added in Epic 5 (docs/v2/adr/0015 §5) — Checkout's `CancelOrderUseCase`
 * needs to read a reservation's current status/warehouseId to decide
 * whether cancelling an order should release the hold or restock via a
 * return, without exposing the full repository across the module
 * boundary.
 */
@Injectable()
export class GetStockReservationUseCase {
  constructor(
    @Inject(STOCK_RESERVATION_REPOSITORY) private readonly reservations: StockReservationRepository,
  ) {}

  async execute(input: GetStockReservationInput): Promise<StockReservation> {
    const reservation = await this.reservations.findById(input.reservationId);
    if (!reservation) {
      throw new StockReservationNotFoundError(input.reservationId);
    }
    return reservation;
  }
}
