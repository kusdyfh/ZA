import { Inject, Injectable } from '@nestjs/common';
import {
  STOCK_RESERVATION_REPOSITORY,
  type StockReservationRepository,
} from '../../domain/repositories/stock-reservation.repository';

/**
 * The background-sweep logic from docs/v2/adr/0001 §5 — a repeatable
 * job (per ADR 0003) would call this every 60 seconds. Wiring an actual
 * scheduled job is out of this epic's scope (ADR 0003's background-job
 * infrastructure doesn't exist yet); this use-case is the fully
 * functional, independently-testable logic that job will eventually
 * invoke.
 */
@Injectable()
export class ExpireStockReservationsUseCase {
  constructor(
    @Inject(STOCK_RESERVATION_REPOSITORY) private readonly reservations: StockReservationRepository,
  ) {}

  execute(now: Date = new Date()): Promise<number> {
    return this.reservations.expireAllDue(now);
  }
}
