import type { StockReservation } from '../entities/stock-reservation.entity';
import { STOCK_RESERVATION_STATUS } from '../constants/stock-reservation-status.constants';
import { STOCK_MOVEMENT_TYPE, type StockMovementTypeValue } from '../constants/stock-movement-type.constants';
import {
  InsufficientStockError,
  InvalidAdjustmentQuantityError,
  InvalidQuantityError,
  NegativeStockError,
  ReservationNotConfirmableError,
  ReservationNotReleasableError,
} from '../errors/inventory.errors';

/** Per docs/v2/adr/0001 — "long enough for a card-gateway redirect/3-D Secure flow." */
export const DEFAULT_RESERVATION_TTL_MINUTES = 10;

/**
 * docs/product/06-INVENTORY.md: "An unusually large adjustment (above a
 * configurable size) flags the Manager for awareness." The doc's own
 * Open Questions section leaves the exact size undecided; 100 units is
 * a disclosed placeholder default, not a researched figure — the natural
 * candidate for a per-store `Setting` once that mechanism exists.
 */
export const UNUSUALLY_LARGE_ADJUSTMENT_THRESHOLD = 100;

/**
 * The single home for every inventory business rule, per this epic's
 * explicit instruction — mirrors Epic 3B's `ProductPolicy` in spirit.
 * Nothing here talks to a repository or Prisma; every method takes
 * plain, already-loaded data (or an already-loaded entity) and either
 * returns a computed value / boolean, or throws. The atomicity these
 * rules depend on (locking a row, then checking, then writing) is a
 * repository concern — see `VariantStockRepository.applyMovement()` and
 * `StockReservationRepository.createIfAvailable()`.
 */
export class InventoryPolicy {
  /** available(variant) = stock - SUM(quantity WHERE status = ACTIVE) — the exact ADR 0001 formula. */
  static computeAvailable(quantity: number, activeReservedQuantity: number): number {
    return quantity - activeReservedQuantity;
  }

  static assertPositiveQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new InvalidQuantityError();
    }
  }

  /** Adjustment quantities may be negative (a decrease) but never zero — docs/product/06-INVENTORY.md Validation Rules. */
  static assertNonZeroAdjustmentQuantity(quantity: number): void {
    if (quantity === 0) {
      throw new InvalidAdjustmentQuantityError();
    }
  }

  /** Prevents overselling — the requested quantity can never exceed what's actually available right now. */
  static assertSufficientAvailableStock(available: number, requested: number): void {
    if (requested > available) {
      throw new InsufficientStockError(available, requested);
    }
  }

  /** Never allow negative stock — applies to every movement type, not just manual adjustments. */
  static assertNonNegativeResultingStock(resultingStock: number): void {
    if (resultingStock < 0) {
      throw new NegativeStockError();
    }
  }

  /**
   * The one place that decides what a movement's caller-supplied
   * `quantity` actually does to stock. Callers always pass a
   * semantically meaningful, human-reportable number (e.g. "5 units
   * damaged"); this maps that number to the signed delta applied to
   * `VariantStock.quantity` for the given movement type. `DAMAGED`
   * always maps to a zero delta — a damaged item is never added back to
   * sellable stock (docs/product/06-INVENTORY.md "Returns & Damaged
   * Stock") — the input quantity is still recorded on the movement row
   * for loss-reporting, just not applied to the stock ledger.
   */
  static computeStockDelta(type: StockMovementTypeValue, quantity: number): number {
    switch (type) {
      case STOCK_MOVEMENT_TYPE.RECEIVE:
      case STOCK_MOVEMENT_TYPE.RETURN:
        return Math.abs(quantity);
      case STOCK_MOVEMENT_TYPE.SALE:
        return -Math.abs(quantity);
      case STOCK_MOVEMENT_TYPE.DAMAGED:
        return 0;
      case STOCK_MOVEMENT_TYPE.ADJUSTMENT:
        return quantity;
      default:
        return quantity;
    }
  }

  static isLowStock(available: number, threshold: number | null): boolean {
    if (threshold === null) {
      return false;
    }
    return available <= threshold;
  }

  static isUnusuallyLargeAdjustment(quantity: number): boolean {
    return Math.abs(quantity) >= UNUSUALLY_LARGE_ADJUSTMENT_THRESHOLD;
  }

  static computeExpiresAt(createdAt: Date, ttlMinutes: number = DEFAULT_RESERVATION_TTL_MINUTES): Date {
    return new Date(createdAt.getTime() + ttlMinutes * 60_000);
  }

  /**
   * Returns whether the confirmation should actually proceed (`true`) or
   * is an idempotent no-op (`false`) — per ADR 0001, "a retried confirm/
   * release call is a no-op, never a double-decrement." Throws only for
   * a genuinely invalid transition (confirming an already-released or
   * expired reservation).
   */
  static assertReservationConfirmable(reservation: StockReservation): boolean {
    if (reservation.status === STOCK_RESERVATION_STATUS.CONFIRMED) {
      return false;
    }
    if (reservation.status !== STOCK_RESERVATION_STATUS.ACTIVE) {
      throw new ReservationNotConfirmableError(reservation.status);
    }
    return true;
  }

  /** Same idempotency reasoning as `assertReservationConfirmable`, for release. */
  static assertReservationReleasable(reservation: StockReservation): boolean {
    if (
      reservation.status === STOCK_RESERVATION_STATUS.RELEASED ||
      reservation.status === STOCK_RESERVATION_STATUS.EXPIRED
    ) {
      return false;
    }
    if (reservation.status !== STOCK_RESERVATION_STATUS.ACTIVE) {
      throw new ReservationNotReleasableError(reservation.status);
    }
    return true;
  }
}
