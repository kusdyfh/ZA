import { ReleaseStockReservationUseCase } from './release-stock-reservation.use-case';
import type { StockReservationRepository } from '../../domain/repositories/stock-reservation.repository';
import { StockReservation } from '../../domain/entities/stock-reservation.entity';
import { STOCK_RESERVATION_STATUS } from '../../domain/constants/stock-reservation-status.constants';
import { StockReservationNotFoundError } from '../../domain/errors/inventory.errors';

function buildReservation(status: string = STOCK_RESERVATION_STATUS.ACTIVE): StockReservation {
  return StockReservation.reconstitute({
    id: 'res-1',
    variantId: 'variant-1',
    warehouseId: 'wh-1',
    cartId: 'cart-1',
    quantity: 2,
    status: status as never,
    expiresAt: new Date(Date.now() + 10 * 60_000),
    createdAt: new Date(),
    confirmedAt: null,
    releasedAt: null,
  });
}

describe('ReleaseStockReservationUseCase', () => {
  let reservations: jest.Mocked<StockReservationRepository>;
  let useCase: ReleaseStockReservationUseCase;

  beforeEach(() => {
    reservations = {
      createIfAvailable: jest.fn(),
      findById: jest.fn(),
      confirm: jest.fn(),
      release: jest.fn(),
      expireAllDue: jest.fn(),
      sumActiveQuantity: jest.fn(),
    };
    useCase = new ReleaseStockReservationUseCase(reservations);
  });

  it('releases an existing reservation without touching stock', async () => {
    reservations.findById.mockResolvedValue(buildReservation());
    reservations.release.mockResolvedValue(buildReservation(STOCK_RESERVATION_STATUS.RELEASED));

    const result = await useCase.execute({ reservationId: 'res-1' });

    expect(reservations.release).toHaveBeenCalledWith('res-1');
    expect(result.status).toBe(STOCK_RESERVATION_STATUS.RELEASED);
  });

  it('throws StockReservationNotFoundError for an unknown reservation', async () => {
    reservations.findById.mockResolvedValue(null);

    await expect(useCase.execute({ reservationId: 'missing' })).rejects.toThrow(
      StockReservationNotFoundError,
    );
    expect(reservations.release).not.toHaveBeenCalled();
  });
});
