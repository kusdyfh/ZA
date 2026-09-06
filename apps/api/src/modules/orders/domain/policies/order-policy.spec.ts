import { OrderPolicy } from './order-policy';
import { ORDER_STATUS } from '../constants/order-status.constants';
import { PAYMENT_METHOD } from '../constants/payment-method.constants';
import {
  CancelReasonRequiredError,
  EmptyOrderNoteError,
  IllegalOrderStatusTransitionError,
  InvalidContactInfoError,
  InvalidShippingAddressError,
  UnsupportedPaymentMethodError,
} from '../errors/order.errors';

const VALID_CONTACT = { name: 'Demo Customer', email: 'demo@example.com', phone: '+9647700000000' };
const VALID_ADDRESS = {
  fullName: 'Demo Customer',
  phone: '+9647700000000',
  line1: '123 Al-Rasheed Street',
  city: 'Baghdad',
  governorate: 'Baghdad',
  country: 'Iraq',
};

describe('OrderPolicy.assertValidTransition', () => {
  const legalTransitions: [string, string][] = [
    [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED],
    [ORDER_STATUS.PENDING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING],
    [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PREPARING, ORDER_STATUS.PACKED],
    [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PACKED, ORDER_STATUS.SHIPPED],
    [ORDER_STATUS.PACKED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED],
    [ORDER_STATUS.DELIVERED, ORDER_STATUS.RETURNED],
  ];

  it.each(legalTransitions)('allows %s -> %s', (from, to) => {
    expect(() =>
      OrderPolicy.assertValidTransition(from as never, to as never),
    ).not.toThrow();
  });

  it('rejects cancelling a SHIPPED order — cancellation is unavailable after Shipped', () => {
    expect(() =>
      OrderPolicy.assertValidTransition(ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED),
    ).toThrow(IllegalOrderStatusTransitionError);
  });

  it('rejects cancelling a DELIVERED order', () => {
    expect(() =>
      OrderPolicy.assertValidTransition(ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED),
    ).toThrow(IllegalOrderStatusTransitionError);
  });

  it('rejects any transition out of CANCELLED — terminal', () => {
    expect(() =>
      OrderPolicy.assertValidTransition(ORDER_STATUS.CANCELLED, ORDER_STATUS.CONFIRMED),
    ).toThrow(IllegalOrderStatusTransitionError);
  });

  it('rejects any transition out of RETURNED — terminal', () => {
    expect(() =>
      OrderPolicy.assertValidTransition(ORDER_STATUS.RETURNED, ORDER_STATUS.CONFIRMED),
    ).toThrow(IllegalOrderStatusTransitionError);
  });

  it('rejects skipping stages (e.g. Confirmed straight to Shipped)', () => {
    expect(() =>
      OrderPolicy.assertValidTransition(ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED),
    ).toThrow(IllegalOrderStatusTransitionError);
  });

  it('rejects moving backward (e.g. Delivered back to Pending)', () => {
    expect(() =>
      OrderPolicy.assertValidTransition(ORDER_STATUS.DELIVERED, ORDER_STATUS.PENDING),
    ).toThrow(IllegalOrderStatusTransitionError);
  });
});

describe('OrderPolicy.isCancellable', () => {
  it('is cancellable in every pre-Shipped status', () => {
    expect(OrderPolicy.isCancellable(ORDER_STATUS.PENDING)).toBe(true);
    expect(OrderPolicy.isCancellable(ORDER_STATUS.CONFIRMED)).toBe(true);
    expect(OrderPolicy.isCancellable(ORDER_STATUS.PREPARING)).toBe(true);
    expect(OrderPolicy.isCancellable(ORDER_STATUS.PACKED)).toBe(true);
  });

  it('is never cancellable from Shipped onward', () => {
    expect(OrderPolicy.isCancellable(ORDER_STATUS.SHIPPED)).toBe(false);
    expect(OrderPolicy.isCancellable(ORDER_STATUS.DELIVERED)).toBe(false);
    expect(OrderPolicy.isCancellable(ORDER_STATUS.CANCELLED)).toBe(false);
    expect(OrderPolicy.isCancellable(ORDER_STATUS.RETURNED)).toBe(false);
  });
});

describe('OrderPolicy.assertCancelReasonProvided', () => {
  it('allows a non-empty reason', () => {
    expect(() => OrderPolicy.assertCancelReasonProvided('Customer changed mind')).not.toThrow();
  });

  it('rejects an empty or missing reason', () => {
    expect(() => OrderPolicy.assertCancelReasonProvided('')).toThrow(CancelReasonRequiredError);
    expect(() => OrderPolicy.assertCancelReasonProvided('   ')).toThrow(CancelReasonRequiredError);
    expect(() => OrderPolicy.assertCancelReasonProvided(undefined)).toThrow(CancelReasonRequiredError);
    expect(() => OrderPolicy.assertCancelReasonProvided(null)).toThrow(CancelReasonRequiredError);
  });
});

describe('OrderPolicy.assertNonEmptyNote', () => {
  it('allows a non-empty note', () => {
    expect(() => OrderPolicy.assertNonEmptyNote('Some note')).not.toThrow();
  });

  it('rejects an empty note', () => {
    expect(() => OrderPolicy.assertNonEmptyNote('   ')).toThrow(EmptyOrderNoteError);
  });
});

describe('OrderPolicy.assertSupportedPaymentMethod', () => {
  it('allows COD', () => {
    expect(() => OrderPolicy.assertSupportedPaymentMethod(PAYMENT_METHOD.COD)).not.toThrow();
  });

  it('rejects CARD — must go through InitiateCardCheckoutUseCase instead', () => {
    expect(() => OrderPolicy.assertSupportedPaymentMethod(PAYMENT_METHOD.CARD)).toThrow(
      UnsupportedPaymentMethodError,
    );
  });
});

describe('OrderPolicy.assertValidContactInfo', () => {
  it('allows valid contact info', () => {
    expect(() => OrderPolicy.assertValidContactInfo(VALID_CONTACT)).not.toThrow();
  });

  it('rejects a blank name', () => {
    expect(() => OrderPolicy.assertValidContactInfo({ ...VALID_CONTACT, name: '  ' })).toThrow(
      InvalidContactInfoError,
    );
  });

  it('rejects a malformed email', () => {
    expect(() => OrderPolicy.assertValidContactInfo({ ...VALID_CONTACT, email: 'not-an-email' })).toThrow(
      InvalidContactInfoError,
    );
  });

  it('rejects a blank phone', () => {
    expect(() => OrderPolicy.assertValidContactInfo({ ...VALID_CONTACT, phone: '' })).toThrow(
      InvalidContactInfoError,
    );
  });
});

describe('OrderPolicy.assertValidShippingAddress', () => {
  it('allows a valid address', () => {
    expect(() => OrderPolicy.assertValidShippingAddress(VALID_ADDRESS)).not.toThrow();
  });

  it.each(['fullName', 'phone', 'line1', 'city', 'governorate', 'country'] as const)(
    'rejects a blank %s',
    (field) => {
      expect(() =>
        OrderPolicy.assertValidShippingAddress({ ...VALID_ADDRESS, [field]: '  ' }),
      ).toThrow(InvalidShippingAddressError);
    },
  );
});

describe('OrderPolicy.computeTotal', () => {
  it('adds shipping/tax and subtracts discount from subtotal', () => {
    const total = OrderPolicy.computeTotal({
      subtotal: 78000,
      discountTotal: 1000,
      shippingFee: 5000,
      taxTotal: 0,
    });
    expect(total).toBe(78000 - 1000 + 5000);
  });

  it('rounds to 2 decimal places', () => {
    const total = OrderPolicy.computeTotal({
      subtotal: 10.005,
      discountTotal: 0,
      shippingFee: 0,
      taxTotal: 0,
    });
    expect(total).toBeCloseTo(10.01, 2);
  });
});

describe('OrderPolicy.generateOrderNumber', () => {
  it('generates an ORD-YYYYMMDD-XXXXXXXX formatted number', () => {
    const orderNumber = OrderPolicy.generateOrderNumber(new Date('2026-08-02T12:00:00Z'));
    expect(orderNumber).toMatch(/^ORD-20260802-[0-9A-F]{8}$/);
  });

  it('generates distinct numbers on successive calls', () => {
    const first = OrderPolicy.generateOrderNumber();
    const second = OrderPolicy.generateOrderNumber();
    expect(first).not.toBe(second);
  });
});
