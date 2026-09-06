import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import {
  VARIANT_STOCK_REPOSITORY,
  type VariantStockRepository,
} from '../../domain/repositories/variant-stock.repository';
import { WAREHOUSE_REPOSITORY, type WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import {
  PRODUCT_VARIANT_REPOSITORY,
  type ProductVariantRepository,
} from '../../../catalog/domain/repositories/product-variant.repository';
import type { VariantStock } from '../../domain/entities/variant-stock.entity';
import { ProductVariantNotFoundError, WarehouseNotFoundError } from '../../domain/errors/inventory.errors';

export interface SetLowStockThresholdInput {
  variantId: string;
  warehouseId?: string;
  threshold: number | null;
}

@Injectable()
export class SetLowStockThresholdUseCase {
  constructor(
    @Inject(VARIANT_STOCK_REPOSITORY) private readonly variantStocks: VariantStockRepository,
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouses: WarehouseRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly productVariants: ProductVariantRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: SetLowStockThresholdInput): Promise<VariantStock> {
    const storeId = await this.storeContext.getCurrentStoreId();

    const variant = await this.productVariants.findById(storeId, input.variantId);
    if (!variant) {
      throw new ProductVariantNotFoundError(input.variantId);
    }

    const warehouse = input.warehouseId
      ? await this.warehouses.findById(storeId, input.warehouseId)
      : await this.warehouses.findDefault(storeId);
    if (!warehouse) {
      throw new WarehouseNotFoundError(input.warehouseId ?? 'default');
    }

    await this.variantStocks.ensureExists(variant.id, warehouse.id);
    return this.variantStocks.setLowStockThreshold(variant.id, warehouse.id, input.threshold);
  }
}
