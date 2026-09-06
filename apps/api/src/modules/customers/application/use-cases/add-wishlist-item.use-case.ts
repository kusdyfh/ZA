import { Inject, Injectable } from '@nestjs/common';
import type { WishlistItem } from '../../domain/entities/wishlist-item.entity';
import { WishlistItemAlreadyExistsError } from '../../domain/errors/customer.errors';
import {
  WISHLIST_ITEM_REPOSITORY,
  type WishlistItemRepository,
} from '../../domain/repositories/wishlist-item.repository';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../../catalog/domain/repositories/product.repository';
import { ProductNotFoundError } from '../../../catalog/domain/errors/catalog.errors';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';

export interface AddWishlistItemInput {
  customerId: string;
  productId: string;
}

/** No limit on wishlist size, per docs/product/14-WISHLIST.md. Reuses Catalog's ProductRepository/ProductNotFoundError directly ("reuse Catalog where appropriate"). */
@Injectable()
export class AddWishlistItemUseCase {
  constructor(
    @Inject(WISHLIST_ITEM_REPOSITORY) private readonly wishlistItems: WishlistItemRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: AddWishlistItemInput): Promise<WishlistItem> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const product = await this.products.findById(storeId, input.productId);
    if (!product) {
      throw new ProductNotFoundError(input.productId);
    }

    const existing = await this.wishlistItems.findByCustomerAndProduct(
      input.customerId,
      input.productId,
    );
    if (existing) {
      throw new WishlistItemAlreadyExistsError();
    }

    return this.wishlistItems.create(input.customerId, input.productId);
  }
}
