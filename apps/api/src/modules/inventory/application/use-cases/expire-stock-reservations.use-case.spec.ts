import { ExpireStockReservationsUseCase } from './expire-stock-reservations.use-case';
import type { StockReservationRepository } from '../../domain/repositories/stock-reservation.repository';

describe('ExpireStockReservationsUseCase', () => {
  let reservations: jest.Mocked<StockReservationRepository>;
  let useCase: ExpireStockReservationsUseCase;

  beforeEach(() => {
    reservations = {
      createIfAvailable: jest.fn(),
      findById: jest.fn(),
      confirm: jest.fn(),
      release: jest.fn(),
      expireAllDue: jest.fn(),
      sumActiveQuantity: jest.fn(),
    };
    useCase = new ExpireStockReservationsUseCase(reservations);
  });

  it('delegates the bulk expiry sweep to the repository with the given cutoff', async () => {
    const now = new Date('2026-01-01T00:00:00Z');
    reservations.expireAllDue.mockResolvedValue(3);

    const result = await useCase.execute(now);

    expect(reservations.expireAllDue).toHaveBeenCalledWith(now);
    expect(result).toBe(3);
  });

  it('defaults the cutoff to the current time when omitted', async () => {
    reservations.expireAllDue.mockResolvedValue(0);

    await useCase.execute();

    expect(reservations.expireAllDue).toHaveBeenCalledWith(expect.any(Date));
  });
});
