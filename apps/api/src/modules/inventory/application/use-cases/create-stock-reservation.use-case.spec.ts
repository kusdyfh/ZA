import { CreateStockReservationUseCase } from './create-stock-reservation.use-case';
import type { StockReservationRepository } from '../../domain/repositories/stock-reservation.repository';
import type { WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import type { ProductVariantRepository } from '../../../catalog/domain/repositories/product-variant.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Warehouse } from '../../domain/entities/warehouse.entity';
import { StockReservation } from '../../domain/entities/stock-reservation.entity';
import { ProductVariant } from '../../../catalog/domain/entities/product-variant.entity';
import { STOCK_RESERVATION_STATUS } from '../../domain/constants/stock-reservation-status.constants';
import {
  InsufficientStockError,
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

describe('CreateStockReservationUseCase', () => {
  let reservations: jest.Mocked<StockReservationRepository>;
  let warehouses: jest.Mocked<WarehouseRepository>;
  let productVariants: jest.Mocked<ProductVariantRepository>;
  let storeContext: StoreContext;
  let useCase: CreateStockReservationUseCase;

  beforeEach(() => {
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
    useCase = new CreateStockReservationUseCase(reservations, warehouses, productVariants, storeContext);

    productVariants.findById.mockResolvedValue(buildVariant());
    warehouses.findDefault.mockResolvedValue(buildWarehouse());
  });

  it('creates a reservation via the repository, delegating the availability check', async () => {
    reservations.createIfAvailable.mockResolvedValue(buildReservation());

    await useCase.execute({ variantId: 'variant-1', cartId: 'cart-1', quantity: 2 });

    expect(reservations.createIfAvailable).toHaveBeenCalledWith({
      variantId: 'variant-1',
      warehouseId: 'wh-1',
      cartId: 'cart-1',
      quantity: 2,
    });
  });

  it('propagates InsufficientStockError from the repository (prevents overselling)', async () => {
    reservations.createIfAvailable.mockRejectedValue(new InsufficientStockError(1, 2));

    await expect(
      useCase.execute({ variantId: 'variant-1', cartId: 'cart-1', quantity: 2 }),
    ).rejects.toThrow(InsufficientStockError);
  });

  it('throws ProductVariantNotFoundError when the variant does not exist', async () => {
    productVariants.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ variantId: 'missing', cartId: 'cart-1', quantity: 2 }),
    ).rejects.toThrow(ProductVariantNotFoundError);
    expect(reservations.createIfAvailable).not.toHaveBeenCalled();
  });

  it('throws WarehouseNotFoundError when no default warehouse exists', async () => {
    warehouses.findDefault.mockResolvedValue(null);

    await expect(
      useCase.execute({ variantId: 'variant-1', cartId: 'cart-1', quantity: 2 }),
    ).rejects.toThrow(WarehouseNotFoundError);
  });

  it('rejects a non-positive quantity before touching the repository', async () => {
    await expect(
      useCase.execute({ variantId: 'variant-1', cartId: 'cart-1', quantity: 0 }),
    ).rejects.toThrow();
    expect(reservations.createIfAvailable).not.toHaveBeenCalled();
  });
});
