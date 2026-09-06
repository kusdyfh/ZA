import type { Cart } from '../entities/cart.entity';

export const CART_REPOSITORY = Symbol('CART_REPOSITORY');

/**
 * `addItem` upserts — incrementing quantity if the variant is already in
 * the cart (matching the `(cartId, variantId)` unique constraint),
 * inserting a new row otherwise. `setItemQuantity` sets an absolute
 * value (used by cart-page quantity edits, distinct from the "add more"
 * semantics of `addItem`). Every mutator returns the reloaded aggregate.
 */
export interface CartRepository {
  findOrCreateByToken(storeId: string, guestToken: string): Promise<Cart>;
  findByToken(storeId: string, guestToken: string): Promise<Cart | null>;
  addItem(cartId: string, variantId: string, quantity: number): Promise<Cart>;
  setItemQuantity(cartId: string, variantId: string, quantity: number): Promise<Cart>;
  removeItem(cartId: string, variantId: string): Promise<Cart>;
  clear(cartId: string): Promise<void>;
}
