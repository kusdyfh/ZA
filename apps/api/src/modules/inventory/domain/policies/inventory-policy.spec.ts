import {
  InventoryPolicy,
  DEFAULT_RESERVATION_TTL_MINUTES,
  UNUSUALLY_LARGE_ADJUSTMENT_THRESHOLD,
} from './inventory-policy';
import { StockReservation, type StockReservationProps } from '../entities/stock-reservation.entity';
import { STOCK_RESERVATION_STATUS } from '../constants/stock-reservation-status.constants';
import { STOCK_MOVEMENT_TYPE } from '../constants/stock-movement-type.constants';
import {
  InsufficientStockError,
  InvalidAdjustmentQuantityError,
  InvalidQuantityError,
  NegativeStockError,
  ReservationNotConfirmableError,
  ReservationNotReleasableError,
} from '../errors/inventory.errors';

function buildReservation(overrides: Partial<StockReservationProps> = {}): StockReservation {
  const props: StockReservationProps = {
    id: 'res-1',
    variantId: 'variant-1',
    warehouseId: 'wh-1',
    cartId: 'cart-1',
    quantity: 2,
    status: STOCK_RESERVATION_STATUS.ACTIVE,
    expiresAt: new Date(Date.now() + 10 * 60_000),
    createdAt: new Date(),
    confirmedAt: null,
    releasedAt: null,
    ...overrides,
  };
  return StockReservation.reconstitute(props);
}

describe('InventoryPolicy.computeAvailable', () => {
  it('subtracts active reservations from raw stock — the ADR 0001 formula', () => {
    expect(InventoryPolicy.computeAvailable(10, 3)).toBe(7);
  });

  it('can go negative if reservations somehow exceed stock (never expected, but not clamped)', () => {
    expect(InventoryPolicy.computeAvailable(5, 8)).toBe(-3);
  });
});

describe('InventoryPolicy.assertPositiveQuantity', () => {
  it('allows a positive quantity', () => {
    expect(() => InventoryPolicy.assertPositiveQuantity(1)).not.toThrow();
  });

  it('rejects zero', () => {
    expect(() => InventoryPolicy.assertPositiveQuantity(0)).toThrow(InvalidQuantityError);
  });

  it('rejects a negative quantity', () => {
    expect(() => InventoryPolicy.assertPositiveQuantity(-1)).toThrow(InvalidQuantityError);
  });
});

describe('InventoryPolicy.assertNonZeroAdjustmentQuantity', () => {
  it('allows a positive adjustment', () => {
    expect(() => InventoryPolicy.assertNonZeroAdjustmentQuantity(5)).not.toThrow();
  });

  it('allows a negative adjustment', () => {
    expect(() => InventoryPolicy.assertNonZeroAdjustmentQuantity(-5)).not.toThrow();
  });

  it('rejects a zero adjustment', () => {
    expect(() => InventoryPolicy.assertNonZeroAdjustmentQuantity(0)).toThrow(
      InvalidAdjustmentQuantityError,
    );
  });
});

describe('InventoryPolicy.assertSufficientAvailableStock', () => {
  it('allows a request within the available amount', () => {
    expect(() => InventoryPolicy.assertSufficientAvailableStock(5, 5)).not.toThrow();
  });

  it('prevents overselling — rejects a request exceeding availability', () => {
    expect(() => InventoryPolicy.assertSufficientAvailableStock(1, 2)).toThrow(
      InsufficientStockError,
    );
  });
});

describe('InventoryPolicy.assertNonNegativeResultingStock', () => {
  it('allows a resulting stock of zero', () => {
    expect(() => InventoryPolicy.assertNonNegativeResultingStock(0)).not.toThrow();
  });

  it('never allows negative resulting stock', () => {
    expect(() => InventoryPolicy.assertNonNegativeResultingStock(-1)).toThrow(NegativeStockError);
  });
});

describe('InventoryPolicy.computeStockDelta', () => {
  it('RECEIVE always increases stock by the absolute quantity', () => {
    expect(InventoryPolicy.computeStockDelta(STOCK_MOVEMENT_TYPE.RECEIVE, 5)).toBe(5);
  });

  it('RETURN always increases stock by the absolute quantity', () => {
    expect(InventoryPolicy.computeStockDelta(STOCK_MOVEMENT_TYPE.RETURN, 5)).toBe(5);
  });

  it('SALE always decreases stock by the absolute quantity', () => {
    expect(InventoryPolicy.computeStockDelta(STOCK_MOVEMENT_TYPE.SALE, 5)).toBe(-5);
  });

  it('DAMAGED never touches the stock ledger — always a zero delta', () => {
    expect(InventoryPolicy.computeStockDelta(STOCK_MOVEMENT_TYPE.DAMAGED, 5)).toBe(0);
  });

  it('ADJUSTMENT applies the caller-supplied signed quantity as-is', () => {
    expect(InventoryPolicy.computeStockDelta(STOCK_MOVEMENT_TYPE.ADJUSTMENT, 5)).toBe(5);
    expect(InventoryPolicy.computeStockDelta(STOCK_MOVEMENT_TYPE.ADJUSTMENT, -5)).toBe(-5);
  });
});

describe('InventoryPolicy.isLowStock', () => {
  it('is never low stock when no threshold is set', () => {
    expect(InventoryPolicy.isLowStock(0, null)).toBe(false);
  });

  it('flags low stock when available is at or below the threshold', () => {
    expect(InventoryPolicy.isLowStock(5, 5)).toBe(true);
    expect(InventoryPolicy.isLowStock(4, 5)).toBe(true);
  });

  it('does not flag low stock when available is above the threshold', () => {
    expect(InventoryPolicy.isLowStock(6, 5)).toBe(false);
  });
});

describe('InventoryPolicy.isUnusuallyLargeAdjustment', () => {
  it('flags an adjustment at or above the threshold', () => {
    expect(InventoryPolicy.isUnusuallyLargeAdjustment(UNUSUALLY_LARGE_ADJUSTMENT_THRESHOLD)).toBe(
      true,
    );
  });

  it('flags a large negative adjustment by magnitude', () => {
    expect(InventoryPolicy.isUnusuallyLargeAdjustment(-UNUSUALLY_LARGE_ADJUSTMENT_THRESHOLD)).toBe(
      true,
    );
  });

  it('does not flag a small adjustment', () => {
    expect(InventoryPolicy.isUnusuallyLargeAdjustment(1)).toBe(false);
  });
});

describe('InventoryPolicy.computeExpiresAt', () => {
  it('defaults to the standard TTL', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const expiresAt = InventoryPolicy.computeExpiresAt(createdAt);
    expect(expiresAt.getTime()).toBe(createdAt.getTime() + DEFAULT_RESERVATION_TTL_MINUTES * 60_000);
  });

  it('honors an explicit TTL', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const expiresAt = InventoryPolicy.computeExpiresAt(createdAt, 30);
    expect(expiresAt.getTime()).toBe(createdAt.getTime() + 30 * 60_000);
  });
});

describe('InventoryPolicy.assertReservationConfirmable', () => {
  it('proceeds for an ACTIVE reservation', () => {
    const reservation = buildReservation({ status: STOCK_RESERVATION_STATUS.ACTIVE });
    expect(InventoryPolicy.assertReservationConfirmable(reservation)).toBe(true);
  });

  it('is an idempotent no-op for an already-CONFIRMED reservation', () => {
    const reservation = buildReservation({ status: STOCK_RESERVATION_STATUS.CONFIRMED });
    expect(InventoryPolicy.assertReservationConfirmable(reservation)).toBe(false);
  });

  it('throws for a RELEASED reservation', () => {
    const reservation = buildReservation({ status: STOCK_RESERVATION_STATUS.RELEASED });
    expect(() => InventoryPolicy.assertReservationConfirmable(reservation)).toThrow(
      ReservationNotConfirmableError,
    );
  });

  it('throws for an EXPIRED reservation', () => {
    const reservation = buildReservation({ status: STOCK_RESERVATION_STATUS.EXPIRED });
    expect(() => InventoryPolicy.assertReservationConfirmable(reservation)).toThrow(
      ReservationNotConfirmableError,
    );
  });
});

describe('InventoryPolicy.assertReservationReleasable', () => {
  it('proceeds for an ACTIVE reservation', () => {
    const reservation = buildReservation({ status: STOCK_RESERVATION_STATUS.ACTIVE });
    expect(InventoryPolicy.assertReservationReleasable(reservation)).toBe(true);
  });

  it('is an idempotent no-op for an already-RELEASED reservation', () => {
    const reservation = buildReservation({ status: STOCK_RESERVATION_STATUS.RELEASED });
    expect(InventoryPolicy.assertReservationReleasable(reservation)).toBe(false);
  });

  it('is an idempotent no-op for an already-EXPIRED reservation', () => {
    const reservation = buildReservation({ status: STOCK_RESERVATION_STATUS.EXPIRED });
    expect(InventoryPolicy.assertReservationReleasable(reservation)).toBe(false);
  });

  it('throws for a CONFIRMED reservation', () => {
    const reservation = buildReservation({ status: STOCK_RESERVATION_STATUS.CONFIRMED });
    expect(() => InventoryPolicy.assertReservationReleasable(reservation)).toThrow(
      ReservationNotReleasableError,
    );
  });
});
