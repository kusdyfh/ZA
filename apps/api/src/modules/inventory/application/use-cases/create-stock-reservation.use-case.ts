import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { StockReservation } from '../../domain/entities/stock-reservation.entity';
import {
  STOCK_RESERVATION_REPOSITORY,
  type StockReservationRepository,
} from '../../domain/repositories/stock-reservation.repository';
import { WAREHOUSE_REPOSITORY, type WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import {
  PRODUCT_VARIANT_REPOSITORY,
  type ProductVariantRepository,
} from '../../../catalog/domain/repositories/product-variant.repository';
import { InventoryPolicy } from '../../domain/policies/inventory-policy';
import { ProductVariantNotFoundError, WarehouseNotFoundError } from '../../domain/errors/inventory.errors';

export interface CreateStockReservationInput {
  variantId: string;
  warehouseId?: string;
  cartId: string;
  quantity: number;
}

/**
 * Created when checkout is *submitted*, never at add-to-cart — see
 * docs/v2/adr/0001. The actual lock + availability check + insert is
 * one atomic operation in the repository
 * (StockReservationRepository.createIfAvailable) — this use-case only
 * resolves the warehouse/variant and validates the input shape first.
 */
@Injectable()
export class CreateStockReservationUseCase {
  constructor(
    @Inject(STOCK_RESERVATION_REPOSITORY) private readonly reservations: StockReservationRepository,
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouses: WarehouseRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly productVariants: ProductVariantRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: CreateStockReservationInput): Promise<StockReservation> {
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

    return this.reservations.createIfAvailable({
      variantId: variant.id,
      warehouseId: warehouse.id,
      cartId: input.cartId,
      quantity: input.quantity,
    });
  }
}
