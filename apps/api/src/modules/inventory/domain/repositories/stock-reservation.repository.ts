import type { ActorRef } from '@za/types';
import type { StockReservation } from '../entities/stock-reservation.entity';

export const STOCK_RESERVATION_REPOSITORY = Symbol('STOCK_RESERVATION_REPOSITORY');

export interface CreateReservationData {
  variantId: string;
  warehouseId: string;
  cartId: string;
  quantity: number;
  ttlMinutes?: number;
}

/**
 * Every method that changes state is atomic with whatever it implies —
 * see docs/v2/adr/0001. `release`/`expireAllDue` never touch
 * `VariantStock.quantity` (a reservation is only a hold, not a
 * deduction) and so never write a `StockMovement`; `confirm` is the one
 * transition that does both.
 */
export interface StockReservationRepository {
  /** Locks the variant's stock row, verifies availability, and inserts the reservation — all in one transaction. Throws InsufficientStockError if not enough is available. */
  createIfAvailable(data: CreateReservationData): Promise<StockReservation>;
  findById(id: string): Promise<StockReservation | null>;
  /** ACTIVE -> CONFIRMED: decrements stock and writes a SALE movement in the same transaction. Idempotent. */
  confirm(id: string, actor: ActorRef): Promise<StockReservation>;
  /** ACTIVE -> RELEASED. Idempotent. */
  release(id: string): Promise<StockReservation>;
  /** The background-sweep logic from ADR 0001 §5 — bulk-expires every ACTIVE reservation past its expiresAt. Returns the count affected. */
  expireAllDue(now: Date): Promise<number>;
  /** SUM(quantity) WHERE status = ACTIVE for one variant/warehouse — the second term of ADR 0001's available() formula. */
  sumActiveQuantity(variantId: string, warehouseId: string): Promise<number>;
}
