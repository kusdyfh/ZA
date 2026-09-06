import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import { StockReservation } from '../../domain/entities/stock-reservation.entity';
import {
  STOCK_RESERVATION_REPOSITORY,
  type StockReservationRepository,
} from '../../domain/repositories/stock-reservation.repository';
import { StockReservationNotFoundError } from '../../domain/errors/inventory.errors';

export interface ConfirmStockReservationInput {
  reservationId: string;
  actor: ActorRef;
}

/**
 * On successful payment (a future Checkout/Order epic calls this):
 * ACTIVE -> CONFIRMED, decrementing stock and writing a SALE movement,
 * atomically, per docs/v2/adr/0001. Idempotent — a retried call is a
 * no-op, never a double-decrement.
 */
@Injectable()
export class ConfirmStockReservationUseCase {
  constructor(
    @Inject(STOCK_RESERVATION_REPOSITORY) private readonly reservations: StockReservationRepository,
  ) {}

  async execute(input: ConfirmStockReservationInput): Promise<StockReservation> {
    const existing = await this.reservations.findById(input.reservationId);
    if (!existing) {
      throw new StockReservationNotFoundError(input.reservationId);
    }
    return this.reservations.confirm(input.reservationId, input.actor);
  }
}
