import { ActorType } from '@za/types';
import { Order, type OrderProps } from './order.entity';
import { ORDER_STATUS } from '../constants/order-status.constants';
import { PAYMENT_METHOD } from '../constants/payment-method.constants';
import { PAYMENT_STATUS } from '../constants/payment-status.constants';

function buildOrder(overrides: Partial<OrderProps> = {}): Order {
  const props: OrderProps = {
    id: 'order-1',
    storeId: 'store-1',
    orderNumber: 'ORD-20260802-ABCD1234',
    status: ORDER_STATUS.PENDING,
    customerId: null,
    customerNameSnapshot: 'Demo Customer',
    customerEmailSnapshot: 'demo@example.com',
    customerPhoneSnapshot: '+9647700000000',
    shippingFullName: 'Demo Customer',
    shippingPhone: '+9647700000000',
    shippingLine1: '123 Al-Rasheed Street',
    shippingLine2: null,
    shippingCity: 'Baghdad',
    shippingGovernorate: 'Baghdad',
    shippingCountry: 'Iraq',
    shippingMethodId: null,
    subtotal: 78000,
    discountTotal: 0,
    shippingFee: 5000,
    taxTotal: 0,
    total: 83000,
    currencyCode: 'IQD',
    paymentMethod: PAYMENT_METHOD.COD,
    paymentStatus: PAYMENT_STATUS.PENDING,
    cancelReason: null,
    items: [
      {
        id: 'item-1',
        variantId: 'variant-1',
        stockReservationId: 'res-1',
        productNameSnapshot: 'Classic V-Neck Scrub Top',
        skuSnapshot: 'ZA-TOP-VNECK-001-NVY-M',
        unitPrice: 39000,
        quantity: 2,
        lineTotal: 78000,
      },
    ],
    statusHistory: [
      {
        id: 'hist-1',
        status: ORDER_STATUS.PENDING,
        note: 'Order placed.',
        actorId: null,
        actorType: ActorType.SYSTEM,
        createdAt: new Date(),
      },
    ],
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return Order.reconstitute(props);
}

describe('Order', () => {
  it('exposes every scalar field via getters', () => {
    const order = buildOrder();
    expect(order.orderNumber).toBe('ORD-20260802-ABCD1234');
    expect(order.status).toBe(ORDER_STATUS.PENDING);
    expect(order.total).toBe(83000);
    expect(order.paymentMethod).toBe(PAYMENT_METHOD.COD);
  });

  it('reconstitutes its items as OrderItem instances', () => {
    const order = buildOrder();
    expect(order.items).toHaveLength(1);
    expect(order.items[0]!.productNameSnapshot).toBe('Classic V-Neck Scrub Top');
  });

  it('reconstitutes its status history as OrderStatusHistoryEntry instances', () => {
    const order = buildOrder();
    expect(order.statusHistory).toHaveLength(1);
    expect(order.statusHistory[0]!.status).toBe(ORDER_STATUS.PENDING);
  });

  it('reconstitutes its notes as OrderNote instances', () => {
    const order = buildOrder({
      notes: [
        {
          id: 'note-1',
          body: 'Internal note.',
          isInternal: true,
          actorId: 'admin-1',
          actorType: ActorType.ADMIN,
          createdAt: new Date(),
        },
      ],
    });
    expect(order.notes).toHaveLength(1);
    expect(order.notes[0]!.body).toBe('Internal note.');
  });

  it('is immutable — no mutator methods exist, per "immutable except allowed status transitions"', () => {
    const order = buildOrder() as unknown as Record<string, unknown>;
    expect(order.transitionTo).toBeUndefined();
    expect(order.changeStatus).toBeUndefined();
    expect(order.addNote).toBeUndefined();
  });
});
