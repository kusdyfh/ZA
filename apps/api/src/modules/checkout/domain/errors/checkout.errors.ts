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

export class InvalidPhoneNumberError extends DomainError {
  readonly code = 'INVALID_PHONE_NUMBER';
  constructor() {
    super('Enter a valid Iraqi phone number (e.g. 07XXXXXXXXX).');
  }
}

export class VerificationCodeRequestTooSoonError extends DomainError {
  readonly code = 'VERIFICATION_CODE_REQUEST_TOO_SOON';
  constructor() {
    super('A code was already sent — wait a bit before requesting another.');
  }
}

export class InvalidVerificationCodeError extends DomainError {
  readonly code = 'INVALID_VERIFICATION_CODE';
  constructor() {
    super('That code is incorrect.');
  }
}

export class VerificationCodeExpiredError extends DomainError {
  readonly code = 'VERIFICATION_CODE_EXPIRED';
  constructor() {
    super('That code has expired — request a new one.');
  }
}

export class TooManyVerificationAttemptsError extends DomainError {
  readonly code = 'TOO_MANY_VERIFICATION_ATTEMPTS';
  constructor() {
    super('Too many incorrect attempts — request a new code.');
  }
}

/** Surfaced at order placement when `customerPhone` has no recent, successful WhatsApp verification. */
export class PhoneNotVerifiedError extends DomainError {
  readonly code = 'PHONE_NOT_VERIFIED';
  constructor() {
    super('Verify your phone number before placing the order.');
  }
}
