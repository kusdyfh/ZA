import { ActorType } from '@za/types';
import { ConfirmStockReservationUseCase } from './confirm-stock-reservation.use-case';
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

describe('ConfirmStockReservationUseCase', () => {
  let reservations: jest.Mocked<StockReservationRepository>;
  let useCase: ConfirmStockReservationUseCase;

  beforeEach(() => {
    reservations = {
      createIfAvailable: jest.fn(),
      findById: jest.fn(),
      confirm: jest.fn(),
      release: jest.fn(),
      expireAllDue: jest.fn(),
      sumActiveQuantity: jest.fn(),
    };
    useCase = new ConfirmStockReservationUseCase(reservations);
  });

  it('confirms an existing reservation, delegating the stock decrement to the repository', async () => {
    const actor = { actorId: 'admin-1', actorType: ActorType.ADMIN };
    reservations.findById.mockResolvedValue(buildReservation());
    reservations.confirm.mockResolvedValue(buildReservation(STOCK_RESERVATION_STATUS.CONFIRMED));

    const result = await useCase.execute({ reservationId: 'res-1', actor });

    expect(reservations.confirm).toHaveBeenCalledWith('res-1', actor);
    expect(result.status).toBe(STOCK_RESERVATION_STATUS.CONFIRMED);
  });

  it('throws StockReservationNotFoundError for an unknown reservation', async () => {
    reservations.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ reservationId: 'missing', actor: { actorId: 'admin-1', actorType: ActorType.ADMIN } }),
    ).rejects.toThrow(StockReservationNotFoundError);
    expect(reservations.confirm).not.toHaveBeenCalled();
  });
});
