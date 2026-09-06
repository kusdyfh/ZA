import { DomainError } from '../../../../shared/errors/domain-error';

export class PaymentSessionNotFoundError extends DomainError {
  readonly code = 'PAYMENT_SESSION_NOT_FOUND';
  constructor(id: string) {
    super(`Payment session "${id}" was not found.`);
  }
}

export class PaymentSessionNotPendingError extends DomainError {
  readonly code = 'PAYMENT_SESSION_NOT_PENDING';
  constructor(id: string, status: string) {
    super(`Payment session "${id}" is "${status}", not "PENDING" — it has already been resolved.`);
  }
}

export class PaymentWebhookSignatureInvalidError extends DomainError {
  readonly code = 'PAYMENT_WEBHOOK_SIGNATURE_INVALID';
  constructor() {
    super('The webhook signature could not be verified.');
  }
}

export class OrderNotRefundableError extends DomainError {
  readonly code = 'ORDER_NOT_REFUNDABLE';
  constructor(orderId: string, status: string) {
    super(`Order "${orderId}" is "${status}" — refunds are only issuable for CANCELLED or RETURNED orders.`);
  }
}

export class RefundAmountExceedsOrderTotalError extends DomainError {
  readonly code = 'REFUND_AMOUNT_EXCEEDS_ORDER_TOTAL';
  constructor() {
    super('The refund amount cannot exceed the order total minus any amount already refunded.');
  }
}

export class InvalidRefundReasonError extends DomainError {
  readonly code = 'INVALID_REFUND_REASON';
  constructor() {
    super('A reason is required to issue a refund.');
  }
}
