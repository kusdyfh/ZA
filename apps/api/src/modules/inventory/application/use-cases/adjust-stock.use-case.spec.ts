import { ActorType } from '@za/types';
import { AdjustStockUseCase } from './adjust-stock.use-case';
import type { VariantStockRepository } from '../../domain/repositories/variant-stock.repository';
import type { WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import type { ProductVariantRepository } from '../../../catalog/domain/repositories/product-variant.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Warehouse } from '../../domain/entities/warehouse.entity';
import { VariantStock } from '../../domain/entities/variant-stock.entity';
import { StockMovement } from '../../domain/entities/stock-movement.entity';
import { ProductVariant } from '../../../catalog/domain/entities/product-variant.entity';
import { STOCK_MOVEMENT_TYPE } from '../../domain/constants/stock-movement-type.constants';
import { STOCK_ADJUSTMENT_REASON } from '../../domain/constants/stock-adjustment-reason.constants';
import {
  InvalidAdjustmentQuantityError,
  ProductVariantNotFoundError,
  WarehouseNotFoundError,
} from '../../domain/errors/inventory.errors';

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

function buildApplyResult(resultingStock: number) {
  return {
    variantStock: VariantStock.reconstitute({
      id: 'vs-1',
      variantId: 'variant-1',
      warehouseId: 'wh-1',
      quantity: resultingStock,
      lowStockThreshold: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    movement: StockMovement.reconstitute({
      id: 'mov-1',
      variantId: 'variant-1',
      warehouseId: 'wh-1',
      type: STOCK_MOVEMENT_TYPE.ADJUSTMENT,
      quantity: resultingStock,
      resultingStock,
      reason: STOCK_ADJUSTMENT_REASON.STOCKTAKE_CORRECTION,
      note: null,
      actorId: null,
      actorType: ActorType.SYSTEM,
      createdAt: new Date(),
    }),
  };
}

describe('AdjustStockUseCase', () => {
  let variantStocks: jest.Mocked<VariantStockRepository>;
  let warehouses: jest.Mocked<WarehouseRepository>;
  let productVariants: jest.Mocked<ProductVariantRepository>;
  let storeContext: StoreContext;
  let useCase: AdjustStockUseCase;

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
    useCase = new AdjustStockUseCase(variantStocks, warehouses, productVariants, storeContext);

    productVariants.findById.mockResolvedValue(buildVariant());
    warehouses.findDefault.mockResolvedValue(buildWarehouse());
  });

  it('applies a signed ADJUSTMENT movement with the given reason', async () => {
    variantStocks.applyMovement.mockResolvedValue(buildApplyResult(30));

    await useCase.execute({
      variantId: 'variant-1',
      quantity: 5,
      reason: STOCK_ADJUSTMENT_REASON.FOUND,
      actor: { actorId: null, actorType: ActorType.SYSTEM },
    });

    expect(variantStocks.applyMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        type: STOCK_MOVEMENT_TYPE.ADJUSTMENT,
        quantity: 5,
        reason: STOCK_ADJUSTMENT_REASON.FOUND,
      }),
    );
  });

  it('flags an unusually large adjustment', async () => {
    variantStocks.applyMovement.mockResolvedValue(buildApplyResult(200));

    const result = await useCase.execute({
      variantId: 'variant-1',
      quantity: 150,
      reason: STOCK_ADJUSTMENT_REASON.STOCKTAKE_CORRECTION,
      actor: { actorId: null, actorType: ActorType.SYSTEM },
    });

    expect(result.isUnusuallyLarge).toBe(true);
  });

  it('does not flag a small adjustment', async () => {
    variantStocks.applyMovement.mockResolvedValue(buildApplyResult(30));

    const result = await useCase.execute({
      variantId: 'variant-1',
      quantity: 5,
      reason: STOCK_ADJUSTMENT_REASON.FOUND,
      actor: { actorId: null, actorType: ActorType.SYSTEM },
    });

    expect(result.isUnusuallyLarge).toBe(false);
  });

  it('rejects a zero adjustment quantity before touching the repository', async () => {
    await expect(
      useCase.execute({
        variantId: 'variant-1',
        quantity: 0,
        reason: STOCK_ADJUSTMENT_REASON.OTHER,
        actor: { actorId: null, actorType: ActorType.SYSTEM },
      }),
    ).rejects.toThrow(InvalidAdjustmentQuantityError);
    expect(variantStocks.applyMovement).not.toHaveBeenCalled();
  });

  it('throws ProductVariantNotFoundError when the variant does not exist', async () => {
    productVariants.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        variantId: 'missing',
        quantity: 5,
        reason: STOCK_ADJUSTMENT_REASON.OTHER,
        actor: { actorId: null, actorType: ActorType.SYSTEM },
      }),
    ).rejects.toThrow(ProductVariantNotFoundError);
  });

  it('throws WarehouseNotFoundError when no default warehouse exists', async () => {
    warehouses.findDefault.mockResolvedValue(null);

    await expect(
      useCase.execute({
        variantId: 'variant-1',
        quantity: 5,
        reason: STOCK_ADJUSTMENT_REASON.OTHER,
        actor: { actorId: null, actorType: ActorType.SYSTEM },
      }),
    ).rejects.toThrow(WarehouseNotFoundError);
  });
});
