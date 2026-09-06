import { SetLowStockThresholdUseCase } from './set-low-stock-threshold.use-case';
import type { VariantStockRepository } from '../../domain/repositories/variant-stock.repository';
import type { WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import type { ProductVariantRepository } from '../../../catalog/domain/repositories/product-variant.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Warehouse } from '../../domain/entities/warehouse.entity';
import { VariantStock } from '../../domain/entities/variant-stock.entity';
import { ProductVariant } from '../../../catalog/domain/entities/product-variant.entity';
import { ProductVariantNotFoundError, WarehouseNotFoundError } from '../../domain/errors/inventory.errors';

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

function buildVariant(): ProductVariant {
  return ProductVariant.reconstitute({
    id: 'variant-1',
    storeId: 'store-1',
    productId: 'prod-1',
    sku: 'SKU-1',
    barcode: null,
    colorId: null,
    sizeId: null,
    priceOverride: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildVariantStock(threshold: number | null): VariantStock {
  return VariantStock.reconstitute({
    id: 'vs-1',
    variantId: 'variant-1',
    warehouseId: 'wh-1',
    quantity: 10,
    lowStockThreshold: threshold,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('SetLowStockThresholdUseCase', () => {
  let variantStocks: jest.Mocked<VariantStockRepository>;
  let warehouses: jest.Mocked<WarehouseRepository>;
  let productVariants: jest.Mocked<ProductVariantRepository>;
  let storeContext: StoreContext;
  let useCase: SetLowStockThresholdUseCase;

  beforeEach(() => {
    variantStocks = {
      findByVariantAndWarehouse: jest.fn(),
      ensureExists: jest.fn(),
      listWithThreshold: jest.fn(),
      setLowStockThreshold: jest.fn(),
      applyMovement: jest.fn(),
    };
    warehouses = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findDefault: jest.fn(),
      list: jest.fn(),
    };
    productVariants = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findBySku: jest.fn(),
      findByBarcode: jest.fn(),
      listByProduct: jest.fn(),
      countByProduct: jest.fn(),
      delete: jest.fn(),
    };
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    useCase = new SetLowStockThresholdUseCase(variantStocks, warehouses, productVariants, storeContext);

    productVariants.findById.mockResolvedValue(buildVariant());
    warehouses.findDefault.mockResolvedValue(buildWarehouse());
  });

  it('ensures the stock row exists before setting the threshold', async () => {
    variantStocks.setLowStockThreshold.mockResolvedValue(buildVariantStock(5));

    await useCase.execute({ variantId: 'variant-1', threshold: 5 });

    expect(variantStocks.ensureExists).toHaveBeenCalledWith('variant-1', 'wh-1');
    expect(variantStocks.setLowStockThreshold).toHaveBeenCalledWith('variant-1', 'wh-1', 5);
  });

  it('allows clearing a threshold with null', async () => {
    variantStocks.setLowStockThreshold.mockResolvedValue(buildVariantStock(null));

    const result = await useCase.execute({ variantId: 'variant-1', threshold: null });

    expect(result.lowStockThreshold).toBeNull();
  });

  it('throws ProductVariantNotFoundError when the variant does not exist', async () => {
    productVariants.findById.mockResolvedValue(null);

    await expect(useCase.execute({ variantId: 'missing', threshold: 5 })).rejects.toThrow(
      ProductVariantNotFoundError,
    );
  });

  it('throws WarehouseNotFoundError when no default warehouse exists', async () => {
    warehouses.findDefault.mockResolvedValue(null);

    await expect(useCase.execute({ variantId: 'variant-1', threshold: 5 })).rejects.toThrow(
      WarehouseNotFoundError,
    );
  });
});
