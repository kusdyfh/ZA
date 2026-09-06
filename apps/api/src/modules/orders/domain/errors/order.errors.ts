import { DomainError } from '../../../../shared/errors/domain-error';

export class OrderNotFoundError extends DomainError {
  readonly code = 'ORDER_NOT_FOUND';
  constructor(id: string) {
    super(`Order "${id}" was not found.`);
  }
}

export class IllegalOrderStatusTransitionError extends DomainError {
  readonly code = 'ILLEGAL_ORDER_STATUS_TRANSITION';
  constructor(from: string, to: string) {
    super(`Cannot move an order from "${from}" to "${to}".`);
  }
}

export class CancelReasonRequiredError extends DomainError {
  readonly code = 'CANCEL_REASON_REQUIRED';
  constructor() {
    super('A reason is required to cancel an order.');
  }
}

export class EmptyOrderNoteError extends DomainError {
  readonly code = 'EMPTY_ORDER_NOTE';
  constructor() {
    super('A note body must not be empty.');
  }
}

export class InvalidContactInfoError extends DomainError {
  readonly code = 'INVALID_CONTACT_INFO';
  constructor(message: string) {
    super(message);
  }
}

export class InvalidShippingAddressError extends DomainError {
  readonly code = 'INVALID_SHIPPING_ADDRESS';
  constructor(field: string) {
    super(`Shipping address field "${field}" is required.`);
  }
}

export class UnsupportedPaymentMethodError extends DomainError {
  readonly code = 'UNSUPPORTED_PAYMENT_METHOD';
  constructor(method: string) {
    super(`Payment method "${method}" is not recognized.`);
  }
}

export class UseCancelOrderUseCaseError extends DomainError {
  readonly code = 'USE_CANCEL_ORDER_USE_CASE';
  constructor() {
    super(
      'Cancelling an order must go through CancelOrderUseCase, which also releases or restocks its stock reservations.',
    );
  }
}
