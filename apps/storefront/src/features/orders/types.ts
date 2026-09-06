export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItem {
  id: string;
  variantId: string | null;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderStatusHistoryEntry {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface OrderNote {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
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
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  taxTotal: number;
  total: number;
  currencyCode: string;
  paymentMethod: string;
  paymentStatus: string;
  cancelReason: string | null;
  items: OrderItem[];
  statusHistory: OrderStatusHistoryEntry[];
  notes: OrderNote[];
  createdAt: string;
  updatedAt: string;
}

export interface PlaceOrderInput {
  guestToken: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingFullName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2?: string;
  shippingCity: string;
  shippingGovernorate: string;
  shippingCountry: string;
  shippingMethodId: string;
  paymentMethod: 'COD';
}

export interface InitiateCardCheckoutInput {
  guestToken: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingFullName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2?: string;
  shippingCity: string;
  shippingGovernorate: string;
  shippingCountry: string;
  shippingMethodId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CardCheckoutSession {
  checkoutUrl: string | null;
  paymentSessionId: string;
}
