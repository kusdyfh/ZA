import {
  StockReservation,
  type StockReservationProps,
} from './stock-reservation.entity';
import { STOCK_RESERVATION_STATUS } from '../constants/stock-reservation-status.constants';

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

describe('StockReservation', () => {
  it('marks a reservation confirmed, stamping confirmedAt', () => {
    const reservation = buildReservation();
    const confirmedAt = new Date();
    reservation.markConfirmed(confirmedAt);
    expect(reservation.status).toBe(STOCK_RESERVATION_STATUS.CONFIRMED);
    expect(reservation.confirmedAt).toBe(confirmedAt);
  });

  it('marks a reservation released, stamping releasedAt', () => {
    const reservation = buildReservation();
    const releasedAt = new Date();
    reservation.markReleased(releasedAt);
    expect(reservation.status).toBe(STOCK_RESERVATION_STATUS.RELEASED);
    expect(reservation.releasedAt).toBe(releasedAt);
  });

  it('marks a reservation expired', () => {
    const reservation = buildReservation();
    reservation.markExpired();
    expect(reservation.status).toBe(STOCK_RESERVATION_STATUS.EXPIRED);
  });

  it('exposes createdAt via a getter', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const reservation = buildReservation({ createdAt });
    expect(reservation.createdAt).toBe(createdAt);
  });
});
