import { Inject, Injectable } from '@nestjs/common';
import {
  WISHLIST_ITEM_REPOSITORY,
  type WishlistItemRepository,
} from '../../domain/repositories/wishlist-item.repository';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../../catalog/domain/repositories/product.repository';
import { PRODUCT_STATUS } from '../../../catalog/domain/constants/product-status.constants';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';

/**
 * Only distinguishes ACTIVE vs. not — a real "Sold Out" (zero stock,
 * every variant unavailable) distinction would require reusing
 * Inventory, which this epic's business rules don't name ("reuse Orders
 * and Catalog where appropriate" — Inventory isn't listed). Disclosed
 * gap, same shape as Catalog's own pre-existing "Product Visibility
 * doesn't account for stock" item.
 */
export type WishlistAvailability = 'AVAILABLE' | 'NO_LONGER_AVAILABLE';

export interface WishlistEntryView {
  productId: string;
  productName: string;
  slug: string;
  price: number;
  currencyCode: string;
  availability: WishlistAvailability;
  addedAt: Date;
}

export interface ListWishlistInput {
  customerId: string;
}

/**
 * Computes availability at read time (docs/product/14-WISHLIST.md's
 * "no longer available" edge case) rather than storing it — a
 * wishlisted, since-archived product stays on the list (never silently
 * disappears), just clearly marked.
 */
@Injectable()
export class ListWishlistUseCase {
  constructor(
    @Inject(WISHLIST_ITEM_REPOSITORY) private readonly wishlistItems: WishlistItemRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: ListWishlistInput): Promise<WishlistEntryView[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const items = await this.wishlistItems.listByCustomerId(input.customerId);

    const views: WishlistEntryView[] = [];
    for (const item of items) {
      const product = await this.products.findById(storeId, item.productId);
      if (!product) {
        continue;
      }
      const effectivePrice = product.discountPrice ?? product.price;

      views.push({
        productId: product.id,
        productName: product.name,
        slug: product.slug.toString(),
        price: effectivePrice.toNumber(),
        currencyCode: effectivePrice.currency,
        availability: product.status === PRODUCT_STATUS.ACTIVE ? 'AVAILABLE' : 'NO_LONGER_AVAILABLE',
        addedAt: item.createdAt,
      });
    }
    return views;
  }
}
