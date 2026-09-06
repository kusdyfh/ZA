import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import {
  VARIANT_STOCK_REPOSITORY,
  type VariantStockRepository,
} from '../../domain/repositories/variant-stock.repository';
import {
  STOCK_RESERVATION_REPOSITORY,
  type StockReservationRepository,
} from '../../domain/repositories/stock-reservation.repository';
import { WAREHOUSE_REPOSITORY, type WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import { InventoryPolicy } from '../../domain/policies/inventory-policy';
import { WarehouseNotFoundError } from '../../domain/errors/inventory.errors';

export interface GetVariantStockInput {
  variantId: string;
  warehouseId?: string;
}

export interface VariantStockView {
  quantity: number;
  available: number;
  lowStockThreshold: number | null;
  isLowStock: boolean;
}

/** Resolves the current stock, available-to-sell, and low-stock status for one variant. */
@Injectable()
export class GetVariantStockUseCase {
  constructor(
    @Inject(VARIANT_STOCK_REPOSITORY) private readonly variantStocks: VariantStockRepository,
    @Inject(STOCK_RESERVATION_REPOSITORY) private readonly reservations: StockReservationRepository,
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouses: WarehouseRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: GetVariantStockInput): Promise<VariantStockView> {
    const storeId = await this.storeContext.getCurrentStoreId();

    const warehouse = input.warehouseId
      ? await this.warehouses.findById(storeId, input.warehouseId)
      : await this.warehouses.findDefault(storeId);
    if (!warehouse) {
      throw new WarehouseNotFoundError(input.warehouseId ?? 'default');
    }

    const variantStock = await this.variantStocks.ensureExists(input.variantId, warehouse.id);
    const activeReserved = await this.reservations.sumActiveQuantity(input.variantId, warehouse.id);
    const available = InventoryPolicy.computeAvailable(variantStock.quantity, activeReserved);

    return {
      quantity: variantStock.quantity,
      available,
      lowStockThreshold: variantStock.lowStockThreshold,
      isLowStock: InventoryPolicy.isLowStock(available, variantStock.lowStockThreshold),
    };
  }
}
