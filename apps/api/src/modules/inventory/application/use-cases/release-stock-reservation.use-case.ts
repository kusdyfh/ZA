import { Inject, Injectable } from '@nestjs/common';
import { StockReservation } from '../../domain/entities/stock-reservation.entity';
import {
  STOCK_RESERVATION_REPOSITORY,
  type StockReservationRepository,
} from '../../domain/repositories/stock-reservation.repository';
import { StockReservationNotFoundError } from '../../domain/errors/inventory.errors';

export interface ReleaseStockReservationInput {
  reservationId: string;
}

/**
 * Explicit checkout failure or customer cancellation — ACTIVE ->
 * RELEASED, per docs/v2/adr/0001. Never touches stock (a reservation is
 * only a hold, not a deduction) and so never writes a StockMovement.
 * Idempotent.
 */
@Injectable()
export class ReleaseStockReservationUseCase {
  constructor(
    @Inject(STOCK_RESERVATION_REPOSITORY) private readonly reservations: StockReservationRepository,
  ) {}

  async execute(input: ReleaseStockReservationInput): Promise<StockReservation> {
    const existing = await this.reservations.findById(input.reservationId);
    if (!existing) {
      throw new StockReservationNotFoundError(input.reservationId);
    }
    return this.reservations.release(input.reservationId);
  }
}
