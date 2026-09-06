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
import type { StockAdjustmentReasonValue } from '../../domain/constants/stock-adjustment-reason.constants';
import { ProductVariantNotFoundError, WarehouseNotFoundError } from '../../domain/errors/inventory.errors';

export interface AdjustStockInput {
  variantId: string;
  warehouseId?: string;
  /** Signed — positive increases stock, negative decreases it. Never zero. */
  quantity: number;
  reason: StockAdjustmentReasonValue;
  note?: string | null;
  actor: ActorRef;
}

export interface AdjustStockResult extends ApplyStockMovementResult {
  /** docs/product/06-INVENTORY.md: "flags the Manager for awareness" — a lightweight signal, not a block. */
  isUnusuallyLarge: boolean;
}

/** A manual correction — e.g. after a physical stocktake. Always requires a reason; can never bring stock below zero. */
@Injectable()
export class AdjustStockUseCase {
  constructor(
    @Inject(VARIANT_STOCK_REPOSITORY) private readonly variantStocks: VariantStockRepository,
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouses: WarehouseRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly productVariants: ProductVariantRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: AdjustStockInput): Promise<AdjustStockResult> {
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

    InventoryPolicy.assertNonZeroAdjustmentQuantity(input.quantity);

    const result = await this.variantStocks.applyMovement({
      variantId: variant.id,
      warehouseId: warehouse.id,
      type: STOCK_MOVEMENT_TYPE.ADJUSTMENT,
      quantity: input.quantity,
      reason: input.reason,
      note: input.note ?? null,
      actor: input.actor,
    });

    return { ...result, isUnusuallyLarge: InventoryPolicy.isUnusuallyLargeAdjustment(input.quantity) };
  }
}
