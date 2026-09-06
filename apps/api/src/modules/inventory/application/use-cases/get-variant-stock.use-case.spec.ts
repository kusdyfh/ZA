import { GetVariantStockUseCase } from './get-variant-stock.use-case';
import type { VariantStockRepository } from '../../domain/repositories/variant-stock.repository';
import type { StockReservationRepository } from '../../domain/repositories/stock-reservation.repository';
import type { WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Warehouse } from '../../domain/entities/warehouse.entity';
import { VariantStock } from '../../domain/entities/variant-stock.entity';
import { WarehouseNotFoundError } from '../../domain/errors/inventory.errors';

function buildWarehouse(): Warehouse {
  return Warehouse.reconstitute({
    id: 'wh-1',
    storeId: 'store-1',
    name: 'Main Warehouse',
    code: 'MAIN',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildVariantStock(overrides: Partial<{ quantity: number; lowStockThreshold: number | null }> = {}): VariantStock {
  return VariantStock.reconstitute({
    id: 'vs-1',
    variantId: 'variant-1',
    warehouseId: 'wh-1',
    quantity: 10,
    lowStockThreshold: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('GetVariantStockUseCase', () => {
  let variantStocks: jest.Mocked<VariantStockRepository>;
  let reservations: jest.Mocked<StockReservationRepository>;
  let warehouses: jest.Mocked<WarehouseRepository>;
  let storeContext: StoreContext;
  let useCase: GetVariantStockUseCase;

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
    warehouses = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findDefault: jest.fn(),
      list: jest.fn(),
    };
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    useCase = new GetVariantStockUseCase(variantStocks, reservations, warehouses, storeContext);
    warehouses.findDefault.mockResolvedValue(buildWarehouse());
  });

  it('computes available stock as quantity minus active reservations', async () => {
    variantStocks.ensureExists.mockResolvedValue(buildVariantStock({ quantity: 10 }));
    reservations.sumActiveQuantity.mockResolvedValue(3);

    const result = await useCase.execute({ variantId: 'variant-1' });

    expect(result.quantity).toBe(10);
    expect(result.available).toBe(7);
  });

  it('flags low stock when available is at or below the threshold', async () => {
    variantStocks.ensureExists.mockResolvedValue(buildVariantStock({ quantity: 5, lowStockThreshold: 5 }));
    reservations.sumActiveQuantity.mockResolvedValue(0);

    const result = await useCase.execute({ variantId: 'variant-1' });

    expect(result.isLowStock).toBe(true);
  });

  it('does not flag low stock when no threshold is set', async () => {
    variantStocks.ensureExists.mockResolvedValue(buildVariantStock({ quantity: 0, lowStockThreshold: null }));
    reservations.sumActiveQuantity.mockResolvedValue(0);

    const result = await useCase.execute({ variantId: 'variant-1' });

    expect(result.isLowStock).toBe(false);
  });

  it('throws WarehouseNotFoundError when no default warehouse exists', async () => {
    warehouses.findDefault.mockResolvedValue(null);

    await expect(useCase.execute({ variantId: 'variant-1' })).rejects.toThrow(WarehouseNotFoundError);
  });
});
