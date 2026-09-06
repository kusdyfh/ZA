import { ActorType } from '@za/types';
import { ReceiveStockUseCase } from './receive-stock.use-case';
import type { VariantStockRepository } from '../../domain/repositories/variant-stock.repository';
import type { WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import type { ProductVariantRepository } from '../../../catalog/domain/repositories/product-variant.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Warehouse } from '../../domain/entities/warehouse.entity';
import { VariantStock } from '../../domain/entities/variant-stock.entity';
import { StockMovement } from '../../domain/entities/stock-movement.entity';
import { ProductVariant } from '../../../catalog/domain/entities/product-variant.entity';
import { STOCK_MOVEMENT_TYPE } from '../../domain/constants/stock-movement-type.constants';
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

function buildApplyResult() {
  return {
    variantStock: VariantStock.reconstitute({
      id: 'vs-1',
      variantId: 'variant-1',
      warehouseId: 'wh-1',
      quantity: 25,
      lowStockThreshold: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    movement: StockMovement.reconstitute({
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
    }),
  };
}

describe('ReceiveStockUseCase', () => {
  let variantStocks: jest.Mocked<VariantStockRepository>;
  let warehouses: jest.Mocked<WarehouseRepository>;
  let productVariants: jest.Mocked<ProductVariantRepository>;
  let storeContext: StoreContext;
  let useCase: ReceiveStockUseCase;

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
    useCase = new ReceiveStockUseCase(variantStocks, warehouses, productVariants, storeContext);
  });

  it('applies a RECEIVE movement against the default warehouse when none is specified', async () => {
    productVariants.findById.mockResolvedValue(buildVariant());
    warehouses.findDefault.mockResolvedValue(buildWarehouse());
    variantStocks.applyMovement.mockResolvedValue(buildApplyResult());

    await useCase.execute({
      variantId: 'variant-1',
      quantity: 25,
      actor: { actorId: null, actorType: ActorType.SYSTEM },
    });

    expect(warehouses.findDefault).toHaveBeenCalledWith('store-1');
    expect(variantStocks.applyMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        variantId: 'variant-1',
        warehouseId: 'wh-1',
        type: STOCK_MOVEMENT_TYPE.RECEIVE,
        quantity: 25,
      }),
    );
  });

  it('resolves an explicit warehouse when given', async () => {
    productVariants.findById.mockResolvedValue(buildVariant());
    warehouses.findById.mockResolvedValue(buildWarehouse());
    variantStocks.applyMovement.mockResolvedValue(buildApplyResult());

    await useCase.execute({
      variantId: 'variant-1',
      warehouseId: 'wh-1',
      quantity: 25,
      actor: { actorId: null, actorType: ActorType.SYSTEM },
    });

    expect(warehouses.findById).toHaveBeenCalledWith('store-1', 'wh-1');
    expect(warehouses.findDefault).not.toHaveBeenCalled();
  });

  it('throws ProductVariantNotFoundError when the variant does not exist', async () => {
    productVariants.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ variantId: 'missing', quantity: 5, actor: { actorId: null, actorType: ActorType.SYSTEM } }),
    ).rejects.toThrow(ProductVariantNotFoundError);
    expect(variantStocks.applyMovement).not.toHaveBeenCalled();
  });

  it('throws WarehouseNotFoundError when no default warehouse exists', async () => {
    productVariants.findById.mockResolvedValue(buildVariant());
    warehouses.findDefault.mockResolvedValue(null);

    await expect(
      useCase.execute({ variantId: 'variant-1', quantity: 5, actor: { actorId: null, actorType: ActorType.SYSTEM } }),
    ).rejects.toThrow(WarehouseNotFoundError);
  });

  it('rejects a non-positive quantity before touching the repository', async () => {
    productVariants.findById.mockResolvedValue(buildVariant());
    warehouses.findDefault.mockResolvedValue(buildWarehouse());

    await expect(
      useCase.execute({ variantId: 'variant-1', quantity: 0, actor: { actorId: null, actorType: ActorType.SYSTEM } }),
    ).rejects.toThrow();
    expect(variantStocks.applyMovement).not.toHaveBeenCalled();
  });
});
