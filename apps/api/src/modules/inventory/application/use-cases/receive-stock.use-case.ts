import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import {
  VARIANT_STOCK_REPOSITORY,
  type ApplyStockMovementResult,
  type VariantStockRepository,
} from '../../domain/repositories/variant-stock.repository';
import { WAREHOUSE_REPOSITORY, type WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import {
  PRODUCT_VARIANT_REPOSITORY,
  type ProductVariantRepository,
} from '../../../catalog/domain/repositories/product-variant.repository';
import { InventoryPolicy } from '../../domain/policies/inventory-policy';
import { STOCK_MOVEMENT_TYPE } from '../../domain/constants/stock-movement-type.constants';
import { ProductVariantNotFoundError, WarehouseNotFoundError } from '../../domain/errors/inventory.errors';

export interface ReceiveStockInput {
  variantId: string;
  warehouseId?: string;
  quantity: number;
  note?: string | null;
  actor: ActorRef;
}

/** Warehouse receiving new stock from a supplier — always increases stock. */
@Injectable()
export class ReceiveStockUseCase {
  constructor(
    @Inject(VARIANT_STOCK_REPOSITORY) private readonly variantStocks: VariantStockRepository,
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouses: WarehouseRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly productVariants: ProductVariantRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: ReceiveStockInput): Promise<ApplyStockMovementResult> {
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

    InventoryPolicy.assertPositiveQuantity(input.quantity);

    return this.variantStocks.applyMovement({
      variantId: variant.id,
      warehouseId: warehouse.id,
      type: STOCK_MOVEMENT_TYPE.RECEIVE,
      quantity: input.quantity,
      note: input.note ?? null,
      actor: input.actor,
    });
  }
}
