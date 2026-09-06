import type { WishlistItem } from '../entities/wishlist-item.entity';

export const WISHLIST_ITEM_REPOSITORY = Symbol('WISHLIST_ITEM_REPOSITORY');

export interface WishlistItemRepository {
  create(customerId: string, productId: string): Promise<WishlistItem>;
  findByCustomerAndProduct(customerId: string, productId: string): Promise<WishlistItem | null>;
  delete(customerId: string, productId: string): Promise<void>;
  listByCustomerId(customerId: string): Promise<WishlistItem[]>;
}
