import { GetStockReservationUseCase } from './get-stock-reservation.use-case';
import type { StockReservationRepository } from '../../domain/repositories/stock-reservation.repository';
import { StockReservation } from '../../domain/entities/stock-reservation.entity';
import { STOCK_RESERVATION_STATUS } from '../../domain/constants/stock-reservation-status.constants';
import { StockReservationNotFoundError } from '../../domain/errors/inventory.errors';

function buildReservation(): StockReservation {
  return StockReservation.reconstitute({
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
  });
}

describe('GetStockReservationUseCase', () => {
  let reservations: jest.Mocked<StockReservationRepository>;
  let useCase: GetStockReservationUseCase;

  beforeEach(() => {
    reservations = {
      createIfAvailable: jest.fn(),
      findById: jest.fn(),
      confirm: jest.fn(),
      release: jest.fn(),
      expireAllDue: jest.fn(),
      sumActiveQuantity: jest.fn(),
    };
    useCase = new GetStockReservationUseCase(reservations);
  });

  it('returns the reservation when found', async () => {
    reservations.findById.mockResolvedValue(buildReservation());

    const result = await useCase.execute({ reservationId: 'res-1' });

    expect(result.id).toBe('res-1');
  });

  it('throws StockReservationNotFoundError for an unknown reservation', async () => {
    reservations.findById.mockResolvedValue(null);

    await expect(useCase.execute({ reservationId: 'missing' })).rejects.toThrow(
      StockReservationNotFoundError,
    );
  });
});
