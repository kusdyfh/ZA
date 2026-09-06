import { randomBytes } from 'node:crypto';
import { ORDER_STATUS, type OrderStatusValue } from '../constants/order-status.constants';
import { PAYMENT_METHOD, type PaymentMethodValue } from '../constants/payment-method.constants';
import {
  CancelReasonRequiredError,
  EmptyOrderNoteError,
  IllegalOrderStatusTransitionError,
  InvalidContactInfoError,
  InvalidShippingAddressError,
  UnsupportedPaymentMethodError,
} from '../errors/order.errors';

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
}

export interface ShippingAddressInput {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  governorate: string;
  country: string;
}

export interface OrderTotalsInput {
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  taxTotal: number;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The legal Order status graph — exactly docs/product/07-ORDERS.md's
 * table, no additions. `CANCELLED` is reachable from every pre-`SHIPPED`
 * status; `RETURNED` only from `DELIVERED`; both are terminal.
 */
const LEGAL_TRANSITIONS: Record<OrderStatusValue, readonly OrderStatusValue[]> = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.PACKED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PACKED]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.RETURNED],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.RETURNED]: [],
};

/**
 * The single home for every Order business rule, per this epic's
 * explicit instruction — mirrors Epic 3B's `ProductPolicy` and Epic 4's
 * `InventoryPolicy` in spirit. Nothing here talks to a repository; every
 * method takes plain, already-loaded data and either returns a computed
 * value or throws.
 */
export class OrderPolicy {
  /** The one place the legal status graph is expressed — see docs/product/07-ORDERS.md. */
  static assertValidTransition(from: OrderStatusValue, to: OrderStatusValue): void {
    const allowed = LEGAL_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new IllegalOrderStatusTransitionError(from, to);
    }
  }

  /** Convenience for UI/use-case pre-checks — "cancel" is legal wherever it appears in the graph. */
  static isCancellable(status: OrderStatusValue): boolean {
    return LEGAL_TRANSITIONS[status].includes(ORDER_STATUS.CANCELLED);
  }

  static assertCancelReasonProvided(reason: string | null | undefined): void {
    if (!reason || reason.trim().length === 0) {
      throw new CancelReasonRequiredError();
    }
  }

  static assertNonEmptyNote(body: string): void {
    if (!body || body.trim().length === 0) {
      throw new EmptyOrderNoteError();
    }
  }

  /**
   * `PlaceOrderUseCase`'s only caller — Epic 12 (ADR 0026) added a real
   * CARD flow, but it runs through `InitiateCardCheckoutUseCase`
   * (`POST /checkout/card-sessions`), never through here: an `Order` must
   * not exist until Stripe confirms payment (docs/product/07-ORDERS.md's
   * "no order until payment succeeds"). This still rejects CARD, even
   * though `PlaceOrderDto` accepts it as a syntactically valid
   * `PaymentMethod` value — the controller-level routing convention is
   * not itself a safeguard, so `PlaceOrderUseCase` must keep refusing
   * anything but COD.
   */
  static assertSupportedPaymentMethod(method: PaymentMethodValue): void {
    if (method !== PAYMENT_METHOD.COD) {
      throw new UnsupportedPaymentMethodError(method);
    }
  }

  /** docs/product/08-CHECKOUT.md: "Address, ... and payment method are all required before an order can be placed." */
  static assertValidContactInfo(contact: ContactInfo): void {
    if (!contact.name || contact.name.trim().length === 0) {
      throw new InvalidContactInfoError('Customer name is required.');
    }
    if (!contact.email || !EMAIL_PATTERN.test(contact.email.trim())) {
      throw new InvalidContactInfoError('A valid email address is required.');
    }
    if (!contact.phone || contact.phone.trim().length === 0) {
      throw new InvalidContactInfoError('Phone is required.');
    }
  }

  static assertValidShippingAddress(address: ShippingAddressInput): void {
    if (!address.fullName || address.fullName.trim().length === 0) {
      throw new InvalidShippingAddressError('fullName');
    }
    if (!address.phone || address.phone.trim().length === 0) {
      throw new InvalidShippingAddressError('phone');
    }
    if (!address.line1 || address.line1.trim().length === 0) {
      throw new InvalidShippingAddressError('line1');
    }
    if (!address.city || address.city.trim().length === 0) {
      throw new InvalidShippingAddressError('city');
    }
    if (!address.governorate || address.governorate.trim().length === 0) {
      throw new InvalidShippingAddressError('governorate');
    }
    if (!address.country || address.country.trim().length === 0) {
      throw new InvalidShippingAddressError('country');
    }
  }

  /** total = subtotal - discountTotal + shippingFee + taxTotal, rounded to 2 decimals. */
  static computeTotal(totals: OrderTotalsInput): number {
    const total = totals.subtotal - totals.discountTotal + totals.shippingFee + totals.taxTotal;
    return Math.round(total * 100) / 100;
  }

  /**
   * `ORD-YYYYMMDD-XXXXXXXX` — human-readable, collision-resistant via
   * randomness (8 hex chars = 4+ billion combinations per store per day)
   * rather than a strictly sequential per-store counter, which would need
   * its own dedicated counter table. Not retried on conflict — the
   * collision probability at this codebase's scale is negligible, a
   * disclosed simplification.
   */
  static generateOrderNumber(now: Date = new Date()): string {
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = randomBytes(4).toString('hex').toUpperCase();
    return `ORD-${datePart}-${randomPart}`;
  }
}
