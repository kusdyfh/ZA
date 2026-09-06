import { ActorType } from '@za/types';
import { ListStockMovementsUseCase } from './list-stock-movements.use-case';
import type { StockMovementRepository } from '../../domain/repositories/stock-movement.repository';
import { StockMovement } from '../../domain/entities/stock-movement.entity';
import { STOCK_MOVEMENT_TYPE } from '../../domain/constants/stock-movement-type.constants';

describe('ListStockMovementsUseCase', () => {
  let movements: jest.Mocked<StockMovementRepository>;
  let useCase: ListStockMovementsUseCase;

  beforeEach(() => {
    movements = { listByVariant: jest.fn() };
    useCase = new ListStockMovementsUseCase(movements);
  });

  it('returns the full movement history for a variant', async () => {
    const movement = StockMovement.reconstitute({
      id: 'mov-1',
      variantId: 'variant-1',
      warehouseId: 'wh-1',
      type: STOCK_MOVEMENT_TYPE.RECEIVE,
      quantity: 25,
      resultingStock: 25,
      reason: null,
      note: null,
      actorId: null,
      actorType: ActorType.SYSTEM,
      createdAt: new Date(),
    });
    movements.listByVariant.mockResolvedValue([movement]);

    const result = await useCase.execute({ variantId: 'variant-1' });

    expect(movements.listByVariant).toHaveBeenCalledWith('variant-1');
    expect(result).toEqual([movement]);
  });
});
