import type { CreateOrderItemData } from '../../../orders/domain/repositories/order.repository';

/**
 * Everything `PlaceOrderUseCase` normally computes in one request, captured
 * on `PaymentSession.pendingOrderSnapshot` instead (ADR 0026) — for card
 * payments, the `Order` doesn't exist yet when this is written, and only
 * exists once `ConfirmCardPaymentUseCase` (the webhook handler) reads it
 * back. Shared between `InitiateCardCheckoutUseCase` (writes it) and
 * `ConfirmCardPaymentUseCase` (reads it) as a plain data contract — no
 * behavior lives on it.
 */
export interface PendingOrderSnapshot {
  storeId: string;
  orderNumber: string;
  customerNameSnapshot: string;
  customerEmailSnapshot: string;
  customerPhoneSnapshot: string;
  shippingFullName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingGovernorate: string;
  shippingCountry: string;
  shippingMethodId: string;
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  taxTotal: number;
  total: number;
  currencyCode: string;
  paymentMethod: 'CARD';
  items: CreateOrderItemData[];
  cartId: string;
  reservationIds: string[];
}
