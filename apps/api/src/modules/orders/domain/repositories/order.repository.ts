import type { ActorRef } from '@za/types';
import type { Order } from '../entities/order.entity';
import type { OrderStatusValue } from '../constants/order-status.constants';
import type { PaymentMethodValue } from '../constants/payment-method.constants';
import type { PaymentStatusValue } from '../constants/payment-status.constants';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface CreateOrderItemData {
  variantId: string;
  stockReservationId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CreateOrderData {
  storeId: string;
  orderNumber: string;
  /** Epic 8 — always null from PlaceOrderUseCase today (ADR 0018 §4); present for a future direct-checkout-linking epic. */
  customerId?: string | null;

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

  /** Epic 12 (ADR 0027) — nullable, additive: which rate was quoted/chosen at checkout. */
  shippingMethodId?: string | null;
  paymentMethod: PaymentMethodValue;
  items: CreateOrderItemData[];
}

export interface OrderListFilters {
  status?: OrderStatusValue;
}

export interface ChangeOrderStatusOptions {
  paymentStatus?: PaymentStatusValue;
  cancelReason?: string;
}

/**
 * `create` writes `Order` + every `OrderItem` + the initial `PENDING`
 * `OrderStatusHistory` row in one transaction. `changeStatus` is the only
 * way an Order's `status` (or `paymentStatus`/`cancelReason`) ever
 * changes after creation — it validates the transition via `OrderPolicy`
 * and atomically writes the new status + an appended history row, never
 * a bare field update. See the `Order` entity's own doc comment.
 */
export interface OrderRepository {
  create(data: CreateOrderData): Promise<Order>;
  findById(storeId: string, id: string): Promise<Order | null>;
  findByOrderNumber(storeId: string, orderNumber: string): Promise<Order | null>;
  list(storeId: string, filters?: OrderListFilters): Promise<Order[]>;
  changeStatus(
    orderId: string,
    status: OrderStatusValue,
    note: string | null,
    actor: ActorRef,
    options?: ChangeOrderStatusOptions,
  ): Promise<Order>;
  addNote(orderId: string, body: string, isInternal: boolean, actor: ActorRef): Promise<Order>;
  /**
   * Epic 12 (ADR 0026) — the one path that changes `paymentStatus`
   * *without* an order-status transition (e.g. a refund issued after an
   * order is already `CANCELLED`/`RETURNED`, both terminal with no
   * outgoing edge — `changeStatus`'s `options.paymentStatus` bag only
   * fires alongside a real transition). `changeStatus` remains the only
   * path when a transition legitimately happens too, e.g. COD/CARD
   * confirmation — this method does not replace it.
   */
  updatePaymentStatus(orderId: string, status: PaymentStatusValue, note: string | null, actor: ActorRef): Promise<Order>;
  /** Epic 8 (Customer Accounts) — order history, docs/v2/adr/0018. */
  listByCustomerId(customerId: string): Promise<Order[]>;
  /**
   * Epic 8's "Guest Order Association" backfill (ADR 0018 §4): links
   * every order matching `customerEmailSnapshot` with no `customerId`
   * yet. Returns the number of orders updated.
   */
  associateGuestOrders(storeId: string, email: string, customerId: string): Promise<number>;
}
