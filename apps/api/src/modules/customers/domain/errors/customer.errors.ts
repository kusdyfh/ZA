import { DomainError } from '../../../../shared/errors/domain-error';

export class InvalidEmailError extends DomainError {
  readonly code = 'INVALID_EMAIL';
  constructor(value: string) {
    super(`"${value}" is not a valid email address.`);
  }
}

export class InvalidCustomerNameError extends DomainError {
  readonly code = 'INVALID_CUSTOMER_NAME';
  constructor() {
    super('First and last name must not be empty.');
  }
}

/** Per docs/product/01-AUTHENTICATION.md: length over complexity rules, same as staff. */
export class WeakPasswordError extends DomainError {
  readonly code = 'WEAK_PASSWORD';
  constructor(message: string) {
    super(message);
  }
}

export class EmailAlreadyInUseError extends DomainError {
  readonly code = 'EMAIL_ALREADY_IN_USE';
  constructor(email: string) {
    super(`An account with the email "${email}" already exists.`);
  }
}

export class CustomerNotFoundError extends DomainError {
  readonly code = 'CUSTOMER_NOT_FOUND';
  constructor(id: string) {
    super(`Customer "${id}" was not found.`);
  }
}

/** Single generic message for every login failure reason — anti-enumeration, same as staff auth. */
export class InvalidCredentialsError extends DomainError {
  readonly code = 'INVALID_CREDENTIALS';
  constructor() {
    super('Email or password is incorrect.');
  }
}

export class InvalidRefreshTokenError extends DomainError {
  readonly code = 'INVALID_REFRESH_TOKEN';
  constructor() {
    super('This session is no longer valid. Please log in again.');
  }
}

export class RefreshTokenReusedError extends DomainError {
  readonly code = 'REFRESH_TOKEN_REUSED';
  constructor() {
    super('This session was revoked for security reasons. Please log in again.');
  }
}

export class InvalidAddressError extends DomainError {
  readonly code = 'INVALID_ADDRESS';
  constructor(message: string) {
    super(message);
  }
}

export class AddressNotFoundError extends DomainError {
  readonly code = 'ADDRESS_NOT_FOUND';
  constructor(id: string) {
    super(`Address "${id}" was not found.`);
  }
}

export class WishlistItemAlreadyExistsError extends DomainError {
  readonly code = 'WISHLIST_ITEM_ALREADY_EXISTS';
  constructor() {
    super('This product is already on your wishlist.');
  }
}

export class InvalidReviewError extends DomainError {
  readonly code = 'INVALID_REVIEW';
  constructor(message: string) {
    super(message);
  }
}

export class ReviewNotFoundError extends DomainError {
  readonly code = 'REVIEW_NOT_FOUND';
  constructor(id: string) {
    super(`Review "${id}" was not found.`);
  }
}

export class ReviewAlreadyModeratedError extends DomainError {
  readonly code = 'REVIEW_ALREADY_MODERATED';
  constructor() {
    super('This review has already been moderated.');
  }
}
