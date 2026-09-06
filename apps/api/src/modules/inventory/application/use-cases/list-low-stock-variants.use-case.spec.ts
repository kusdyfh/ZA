import { ListLowStockVariantsUseCase } from './list-low-stock-variants.use-case';
import type { VariantStockRepository } from '../../domain/repositories/variant-stock.repository';
import type { StockReservationRepository } from '../../domain/repositories/stock-reservation.repository';
import { VariantStock } from '../../domain/entities/variant-stock.entity';

function buildVariantStock(
  variantId: string,
  overrides: Partial<{ quantity: number; lowStockThreshold: number | null }> = {},
): VariantStock {
  return VariantStock.reconstitute({
    id: `vs-${variantId}`,
    variantId,
    warehouseId: 'wh-1',
    quantity: 10,
    lowStockThreshold: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('ListLowStockVariantsUseCase', () => {
  let variantStocks: jest.Mocked<VariantStockRepository>;
  let reservations: jest.Mocked<StockReservationRepository>;
  let useCase: ListLowStockVariantsUseCase;

  beforeEach(() => {
    variantStocks = {
      findByVariantAndWarehouse: jest.fn(),
      ensureExists: jest.fn(),
      listWithThreshold: jest.fn(),
      setLowStockThreshold: jest.fn(),
      applyMovement: jest.fn(),
    };
    reservations = {
      createIfAvailable: jest.fn(),
      findById: jest.fn(),
      confirm: jest.fn(),
      release: jest.fn(),
      expireAllDue: jest.fn(),
      sumActiveQuantity: jest.fn(),
    };
    useCase = new ListLowStockVariantsUseCase(variantStocks, reservations);
  });

  it('includes only variants whose available stock is at or below their threshold', async () => {
    variantStocks.listWithThreshold.mockResolvedValue([
      buildVariantStock('variant-low', { quantity: 5, lowStockThreshold: 5 }),
      buildVariantStock('variant-ok', { quantity: 20, lowStockThreshold: 5 }),
    ]);
    reservations.sumActiveQuantity.mockResolvedValue(0);

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0]!.variantStock.variantId).toBe('variant-low');
  });

  it('accounts for active reservations when computing availability', async () => {
    variantStocks.listWithThreshold.mockResolvedValue([
      buildVariantStock('variant-1', { quantity: 10, lowStockThreshold: 5 }),
    ]);
    reservations.sumActiveQuantity.mockResolvedValue(6);

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0]!.available).toBe(4);
  });

  it('returns an empty list when nothing is low', async () => {
    variantStocks.listWithThreshold.mockResolvedValue([
      buildVariantStock('variant-1', { quantity: 100, lowStockThreshold: 5 }),
    ]);
    reservations.sumActiveQuantity.mockResolvedValue(0);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });

  it('passes the warehouseId filter through to the repository', async () => {
    variantStocks.listWithThreshold.mockResolvedValue([]);

    await useCase.execute({ warehouseId: 'wh-2' });

    expect(variantStocks.listWithThreshold).toHaveBeenCalledWith('wh-2');
  });
});
