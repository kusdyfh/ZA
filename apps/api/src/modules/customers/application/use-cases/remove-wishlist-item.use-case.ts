import { Inject, Injectable } from '@nestjs/common';
import {
  WISHLIST_ITEM_REPOSITORY,
  type WishlistItemRepository,
} from '../../domain/repositories/wishlist-item.repository';

export interface RemoveWishlistItemInput {
  customerId: string;
  productId: string;
}

/** Idempotent — removing a product not on the wishlist is a no-op. */
@Injectable()
export class RemoveWishlistItemUseCase {
  constructor(
    @Inject(WISHLIST_ITEM_REPOSITORY) private readonly wishlistItems: WishlistItemRepository,
  ) {}

  async execute(input: RemoveWishlistItemInput): Promise<void> {
    await this.wishlistItems.delete(input.customerId, input.productId);
  }
}
