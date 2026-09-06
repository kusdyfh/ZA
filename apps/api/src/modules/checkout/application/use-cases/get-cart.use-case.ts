import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { CART_REPOSITORY, type CartRepository } from '../../domain/repositories/cart.repository';
import {
  PRODUCT_VARIANT_REPOSITORY,
  type ProductVariantRepository,
} from '../../../catalog/domain/repositories/product-variant.repository';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../../catalog/domain/repositories/product.repository';

export interface CartItemView {
  variantId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CartView {
  guestToken: string;
  items: CartItemView[];
  subtotal: number;
  currencyCode: string;
}

export interface GetCartInput {
  guestToken: string;
}

/**
 * Live pricing, unlike an Order — a cart is never a historical snapshot,
 * so its display always reflects the catalog's current state. Resolves
 * each item's variant/product one at a time (N+1); acceptable at this
 * codebase's scale, same disclosed tradeoff as Inventory's
 * `ListLowStockVariantsUseCase`.
 */
@Injectable()
export class GetCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly productVariants: ProductVariantRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: GetCartInput): Promise<CartView> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const cart = await this.carts.findOrCreateByToken(storeId, input.guestToken);

    const items: CartItemView[] = [];
    let currencyCode = 'IQD';

    for (const item of cart.items) {
      const variant = await this.productVariants.findById(storeId, item.variantId);
      if (!variant) {
        continue;
      }
      const product = await this.products.findById(storeId, variant.productId);
      if (!product) {
        continue;
      }

      const effectivePrice = variant.priceOverride ?? product.discountPrice ?? product.price;
      currencyCode = effectivePrice.currency;
      const unitPrice = effectivePrice.toNumber();
      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;

      items.push({
        variantId: variant.id,
        productName: product.name,
        sku: variant.sku,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
      });
    }

    const subtotal = Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;

    return { guestToken: cart.guestToken, items, subtotal, currencyCode };
  }
}
