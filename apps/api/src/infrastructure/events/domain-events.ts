/**
 * Every domain event named in ADR 0002's table. `WIRED_EVENT_TYPES` are
 * the five this epic actually publishes (see ADR 0023 §"which frozen
 * files this touches") — each has a real payload interface below.
 * `EVENT_TYPES` is the full set for typing anything a future publisher
 * adds; the extra members have no payload interface yet because nothing
 * constructs them (documented target surface, not dead code).
 */
export const EVENT_TYPES = {
  ORDER_PLACED: 'OrderPlaced',
  ORDER_STATUS_CHANGED: 'OrderStatusChanged',
  ORDER_CANCELLED: 'OrderCancelled',
  STOCK_RESERVATION_EXPIRED: 'StockReservationExpired',
  LOW_STOCK_THRESHOLD_CROSSED: 'LowStockThresholdCrossed',
  REVIEW_SUBMITTED: 'ReviewSubmitted',
  COUPON_USAGE_LIMIT_REACHED: 'CouponUsageLimitReached',
  COUPON_EXPIRING: 'CouponExpiring',
  PRODUCT_PUBLISHED: 'ProductPublished',
  PRODUCT_ARCHIVED: 'ProductArchived',
  CONTENT_PUBLISHED: 'ContentPublished',
  CUSTOMER_REGISTERED: 'CustomerRegistered',
  PAYMENT_CAPTURED: 'PaymentCaptured',
  PAYMENT_FAILED: 'PaymentFailed',
  PAYMENT_REFUNDED: 'PaymentRefunded',
  SHIPMENT_DISPATCHED: 'ShipmentDispatched',
  SHIPMENT_DELIVERED: 'ShipmentDelivered',
  WEBHOOK_DELIVERY_REQUESTED: 'WebhookDeliveryRequested',
  PASSWORD_RESET_REQUESTED: 'PasswordResetRequested',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

/** Epic 12 (ADR 0026/0027) wires PAYMENT_CAPTURED/PAYMENT_FAILED — reserved, unused since Epic 11 — plus two new Shipping events. */
export const WIRED_EVENT_TYPES = [
  EVENT_TYPES.ORDER_PLACED,
  EVENT_TYPES.ORDER_STATUS_CHANGED,
  EVENT_TYPES.CUSTOMER_REGISTERED,
  EVENT_TYPES.REVIEW_SUBMITTED,
  EVENT_TYPES.PASSWORD_RESET_REQUESTED,
  EVENT_TYPES.PAYMENT_CAPTURED,
  EVENT_TYPES.PAYMENT_FAILED,
  EVENT_TYPES.PAYMENT_REFUNDED,
  EVENT_TYPES.SHIPMENT_DISPATCHED,
  EVENT_TYPES.SHIPMENT_DELIVERED,
] as const;

export type WiredEventType = (typeof WIRED_EVENT_TYPES)[number];

export interface OrderPlacedEvent {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  total: number;
  currencyCode: string;
}

export interface OrderStatusChangedEvent {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  fromStatus: string;
  toStatus: string;
}

export interface CustomerRegisteredEvent {
  customerId: string;
  email: string;
  firstName: string;
}

export interface ReviewSubmittedEvent {
  reviewId: string;
  productId: string;
  productName: string;
  rating: number;
}

export interface PasswordResetRequestedEvent {
  adminUserId: string;
  email: string;
  rawToken: string;
}

/** Epic 12 (ADR 0026) — orderId is null for a card capture (the Order is created in the same transaction this event is written from, per the "no order until payment succeeds" rule) or set for COD's manual-verification capture. */
export interface PaymentCapturedEvent {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  amount: number;
  currencyCode: string;
  provider: string;
}

/** No orderId — per docs/product/07-ORDERS.md, a failed/abandoned card payment never creates an Order. */
export interface PaymentFailedEvent {
  paymentSessionId: string;
  customerEmail: string | null;
  amount: number;
  currencyCode: string;
  reason: string | null;
}

export interface PaymentRefundedEvent {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  amount: number;
  currencyCode: string;
}

export interface ShipmentDispatchedEvent {
  shipmentId: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
}

export interface ShipmentDeliveredEvent {
  shipmentId: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
}

export type EventPayloadMap = {
  [EVENT_TYPES.ORDER_PLACED]: OrderPlacedEvent;
  [EVENT_TYPES.ORDER_STATUS_CHANGED]: OrderStatusChangedEvent;
  [EVENT_TYPES.CUSTOMER_REGISTERED]: CustomerRegisteredEvent;
  [EVENT_TYPES.REVIEW_SUBMITTED]: ReviewSubmittedEvent;
  [EVENT_TYPES.PASSWORD_RESET_REQUESTED]: PasswordResetRequestedEvent;
  [EVENT_TYPES.PAYMENT_CAPTURED]: PaymentCapturedEvent;
  [EVENT_TYPES.PAYMENT_FAILED]: PaymentFailedEvent;
  [EVENT_TYPES.PAYMENT_REFUNDED]: PaymentRefundedEvent;
  [EVENT_TYPES.SHIPMENT_DISPATCHED]: ShipmentDispatchedEvent;
  [EVENT_TYPES.SHIPMENT_DELIVERED]: ShipmentDeliveredEvent;
};
