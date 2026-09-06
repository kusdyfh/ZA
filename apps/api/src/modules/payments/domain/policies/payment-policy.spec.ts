import { PaymentPolicy } from './payment-policy';
import { ORDER_STATUS } from '../../../orders/domain/constants/order-status.constants';
import {
  InvalidRefundReasonError,
  OrderNotRefundableError,
  RefundAmountExceedsOrderTotalError,
} from '../errors/payment.errors';

describe('PaymentPolicy.assertRefundable', () => {
  it('allows a CANCELLED order', () => {
    expect(() => PaymentPolicy.assertRefundable('order-1', ORDER_STATUS.CANCELLED)).not.toThrow();
  });

  it('allows a RETURNED order', () => {
    expect(() => PaymentPolicy.assertRefundable('order-1', ORDER_STATUS.RETURNED)).not.toThrow();
  });

  it('rejects every other order status', () => {
    expect(() => PaymentPolicy.assertRefundable('order-1', ORDER_STATUS.PENDING)).toThrow(
      OrderNotRefundableError,
    );
    expect(() => PaymentPolicy.assertRefundable('order-1', ORDER_STATUS.CONFIRMED)).toThrow(
      OrderNotRefundableError,
    );
    expect(() => PaymentPolicy.assertRefundable('order-1', ORDER_STATUS.DELIVERED)).toThrow(
      OrderNotRefundableError,
    );
  });
});

describe('PaymentPolicy.assertReasonProvided', () => {
  it('allows a non-empty reason', () => {
    expect(() => PaymentPolicy.assertReasonProvided('Customer returned item')).not.toThrow();
  });

  it('rejects an empty, whitespace, or missing reason', () => {
    expect(() => PaymentPolicy.assertReasonProvided('')).toThrow(InvalidRefundReasonError);
    expect(() => PaymentPolicy.assertReasonProvided('   ')).toThrow(InvalidRefundReasonError);
    expect(() => PaymentPolicy.assertReasonProvided(undefined)).toThrow(InvalidRefundReasonError);
    expect(() => PaymentPolicy.assertReasonProvided(null)).toThrow(InvalidRefundReasonError);
  });
});

describe('PaymentPolicy.assertAmountWithinRemaining', () => {
  it('allows an amount within the remaining refundable balance', () => {
    expect(() => PaymentPolicy.assertAmountWithinRemaining(50, 100, 0)).not.toThrow();
    expect(() => PaymentPolicy.assertAmountWithinRemaining(50, 100, 50)).not.toThrow();
  });

  it('rejects a zero or negative amount', () => {
    expect(() => PaymentPolicy.assertAmountWithinRemaining(0, 100, 0)).toThrow(
      RefundAmountExceedsOrderTotalError,
    );
    expect(() => PaymentPolicy.assertAmountWithinRemaining(-10, 100, 0)).toThrow(
      RefundAmountExceedsOrderTotalError,
    );
  });

  it('rejects an amount that pushes cumulative refunds past the order total', () => {
    expect(() => PaymentPolicy.assertAmountWithinRemaining(51, 100, 50)).toThrow(
      RefundAmountExceedsOrderTotalError,
    );
  });

  it('tolerates floating-point rounding at the boundary', () => {
    expect(() => PaymentPolicy.assertAmountWithinRemaining(0.0005, 100, 100)).not.toThrow();
  });
});

describe('PaymentPolicy.resolvePaymentStatusAfterRefund', () => {
  it('resolves to REFUNDED once the cumulative refund reaches the order total', () => {
    expect(PaymentPolicy.resolvePaymentStatusAfterRefund(100, 100)).toBe('REFUNDED');
  });

  it('resolves to REFUNDED when cumulative refund exceeds the order total', () => {
    expect(PaymentPolicy.resolvePaymentStatusAfterRefund(100, 150)).toBe('REFUNDED');
  });

  it('resolves to PARTIALLY_REFUNDED when cumulative refund is below the order total', () => {
    expect(PaymentPolicy.resolvePaymentStatusAfterRefund(100, 50)).toBe('PARTIALLY_REFUNDED');
  });

  it('tolerates floating-point rounding at the boundary', () => {
    expect(PaymentPolicy.resolvePaymentStatusAfterRefund(100, 99.9995)).toBe('REFUNDED');
  });
});
