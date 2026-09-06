import { DomainError } from '../../../../shared/errors/domain-error';

/** Checkout's own copy — bounded contexts don't cross-import domain errors, matching Inventory's precedent. */
export class ProductVariantNotFoundError extends DomainError {
  readonly code = 'PRODUCT_VARIANT_NOT_FOUND';
  constructor(id: string) {
    super(`Product variant "${id}" was not found.`);
  }
}

export class CartNotFoundError extends DomainError {
  readonly code = 'CART_NOT_FOUND';
  constructor(token: string) {
    super(`Cart "${token}" was not found.`);
  }
}

export class CartItemNotFoundError extends DomainError {
  readonly code = 'CART_ITEM_NOT_FOUND';
  constructor(variantId: string) {
    super(`No cart item for variant "${variantId}".`);
  }
}

export class InvalidCartQuantityError extends DomainError {
  readonly code = 'INVALID_CART_QUANTITY';
  constructor() {
    super('Quantity must be greater than zero.');
  }
}

export class EmptyCartError extends DomainError {
  readonly code = 'EMPTY_CART';
  constructor() {
    super('Cannot check out an empty cart.');
  }
}

/**
 * Surfaced when a cart item can no longer be fulfilled at checkout
 * submission (sold out between add-to-cart and submission) — carries the
 * product name so the customer sees exactly which item is affected, per
 * docs/product/08-CHECKOUT.md's "specific item identified" requirement.
 */
export class ItemUnavailableAtCheckoutError extends DomainError {
  readonly code = 'ITEM_UNAVAILABLE_AT_CHECKOUT';
  constructor(productName: string, requested: number) {
    super(
      `"${productName}" is no longer available in the requested quantity ` +
        `(requested ${requested}). Please adjust your cart before continuing.`,
    );
  }
}
