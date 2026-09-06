import type { OrderStatusValue } from '../constants/order-status.constants';
import type { PaymentMethodValue } from '../constants/payment-method.constants';
import type { PaymentStatusValue } from '../constants/payment-status.constants';
import { OrderItem, type OrderItemProps } from './order-item.entity';
import { OrderStatusHistoryEntry, type OrderStatusHistoryEntryProps } from './order-status-history-entry.entity';
import { OrderNote, type OrderNoteProps } from './order-note.entity';

export interface OrderProps {
  id: string;
  storeId: string;
  orderNumber: string;
  status: OrderStatusValue;

  /** Epic 8 (Customer Accounts) — nullable, additive (ADR 0018 §4). */
  customerId: string | null;

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

  paymentMethod: PaymentMethodValue;
  paymentStatus: PaymentStatusValue;
  /** Epic 12 (ADR 0027) — nullable, additive: which rate was quoted/chosen at checkout. */
  shippingMethodId: string | null;
  cancelReason: string | null;

  items: OrderItemProps[];
  statusHistory: OrderStatusHistoryEntryProps[];
  notes: OrderNoteProps[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * The Order aggregate root (docs/06-DDD-BOUNDED-CONTEXTS.md) — items,
 * status history, and notes are all inside its consistency boundary.
 *
 * Fully immutable, deliberately with no mutator methods at all — per
 * this epic's explicit "every Order must be immutable after creation
 * except allowed status transitions" rule, and mirroring how Inventory's
 * `VariantStock`/`StockMovement` forbid any direct setter. The one place
 * allowed to change an Order's status/payment/notes is
 * `OrderRepository` (`changeStatus`/`addNote`), which validates the
 * transition via `OrderPolicy` and atomically writes + reloads — there is
 * no in-memory `mutate-then-save()` path for Order, exactly as there is
 * none for `VariantStock.quantity`.
 */
export class Order {
  private constructor(private readonly props: OrderProps) {}

  static reconstitute(props: OrderProps): Order {
    return new Order(props);
  }

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get orderNumber(): string {
    return this.props.orderNumber;
  }

  get customerId(): string | null {
    return this.props.customerId;
  }

  get status(): OrderStatusValue {
    return this.props.status;
  }

  get customerNameSnapshot(): string {
    return this.props.customerNameSnapshot;
  }

  get customerEmailSnapshot(): string {
    return this.props.customerEmailSnapshot;
  }

  get customerPhoneSnapshot(): string {
    return this.props.customerPhoneSnapshot;
  }

  get shippingFullName(): string {
    return this.props.shippingFullName;
  }

  get shippingPhone(): string {
    return this.props.shippingPhone;
  }

  get shippingLine1(): string {
    return this.props.shippingLine1;
  }

  get shippingLine2(): string | null {
    return this.props.shippingLine2;
  }

  get shippingCity(): string {
    return this.props.shippingCity;
  }

  get shippingGovernorate(): string {
    return this.props.shippingGovernorate;
  }

  get shippingCountry(): string {
    return this.props.shippingCountry;
  }

  get subtotal(): number {
    return this.props.subtotal;
  }

  get discountTotal(): number {
    return this.props.discountTotal;
  }

  get shippingFee(): number {
    return this.props.shippingFee;
  }

  get taxTotal(): number {
    return this.props.taxTotal;
  }

  get total(): number {
    return this.props.total;
  }

  get currencyCode(): string {
    return this.props.currencyCode;
  }

  get paymentMethod(): PaymentMethodValue {
    return this.props.paymentMethod;
  }

  get paymentStatus(): PaymentStatusValue {
    return this.props.paymentStatus;
  }

  get shippingMethodId(): string | null {
    return this.props.shippingMethodId;
  }

  get cancelReason(): string | null {
    return this.props.cancelReason;
  }

  get items(): OrderItem[] {
    return this.props.items.map((item) => OrderItem.reconstitute(item));
  }

  get statusHistory(): OrderStatusHistoryEntry[] {
    return this.props.statusHistory.map((entry) => OrderStatusHistoryEntry.reconstitute(entry));
  }

  get notes(): OrderNote[] {
    return this.props.notes.map((note) => OrderNote.reconstitute(note));
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toProps(): OrderProps {
    return { ...this.props };
  }
}
