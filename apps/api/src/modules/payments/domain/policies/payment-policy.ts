import { ORDER_STATUS, type OrderStatusValue } from '../../../orders/domain/constants/order-status.constants';
import { InvalidRefundReasonError, OrderNotRefundableError, RefundAmountExceedsOrderTotalError } from '../errors/payment.errors';

/**
 * The single home for every Payments business rule, mirroring
 * `OrderPolicy`/`InventoryPolicy`'s established convention. Nothing here
 * talks to a repository.
 */
export class PaymentPolicy {
  /**
   * Refunds are a consequence of cancellation/return in this product's
   * model (docs/product/12-PAYMENTS.md never describes one independent of
   * either) — not an arbitrary balance adjustment.
   */
  static assertRefundable(orderId: string, orderStatus: OrderStatusValue): void {
    if (orderStatus !== ORDER_STATUS.CANCELLED && orderStatus !== ORDER_STATUS.RETURNED) {
      throw new OrderNotRefundableError(orderId, orderStatus);
    }
  }

  static assertReasonProvided(reason: string | null | undefined): void {
    if (!reason || reason.trim().length === 0) {
      throw new InvalidRefundReasonError();
    }
  }

  /** amount + everything already refunded must not exceed the order total. */
  static assertAmountWithinRemaining(amount: number, orderTotal: number, alreadyRefunded: number): void {
    if (amount <= 0 || amount + alreadyRefunded > orderTotal + 0.001) {
      throw new RefundAmountExceedsOrderTotalError();
    }
  }

  /** REFUNDED only once the cumulative refunded amount reaches the full order total; otherwise PARTIALLY_REFUNDED. */
  static resolvePaymentStatusAfterRefund(orderTotal: number, cumulativeRefunded: number): 'REFUNDED' | 'PARTIALLY_REFUNDED' {
    return cumulativeRefunded >= orderTotal - 0.001 ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
  }
}
