import { TrackShipmentUseCase } from './track-shipment.use-case';
import type { OrderRepository } from '../../../orders/domain/repositories/order.repository';
import type { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Order } from '../../../orders/domain/entities/order.entity';
import { Shipment } from '../../domain/entities/shipment.entity';
import { ORDER_STATUS } from '../../../orders/domain/constants/order-status.constants';
import { PAYMENT_METHOD } from '../../../orders/domain/constants/payment-method.constants';
import { PAYMENT_STATUS } from '../../../orders/domain/constants/payment-status.constants';
import { SHIPMENT_STATUS } from '../../domain/constants/shipment-status.constants';
import { ShipmentNotFoundError } from '../../domain/errors/shipping.errors';

function buildOrder(): Order {
  return Order.reconstitute({
    id: 'order-1',
    storeId: 'store-1',
    orderNumber: 'ORD-20260802-ABCD1234',
    status: ORDER_STATUS.SHIPPED,
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
    shippingMethodId: 'method-1',
    subtotal: 78000,
    discountTotal: 0,
    shippingFee: 5000,
    taxTotal: 0,
    total: 83000,
    currencyCode: 'IQD',
    paymentMethod: PAYMENT_METHOD.COD,
    paymentStatus: PAYMENT_STATUS.AWAITING_COLLECTION,
    cancelReason: null,
    items: [],
    statusHistory: [],
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildShipment(): Shipment {
  return Shipment.reconstitute({
    id: 'shipment-1',
    storeId: 'store-1',
    orderId: 'order-1',
    shippingMethodId: 'method-1',
    status: SHIPMENT_STATUS.IN_TRANSIT,
    carrierName: 'Aramex',
    trackingNumber: 'TRK-1',
    trackingUrl: null,
    labelUrl: null,
    dispatchedAt: new Date(),
    deliveredAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    trackingEvents: [],
  });
}

describe('TrackShipmentUseCase', () => {
  let orders: jest.Mocked<OrderRepository>;
  let shipments: jest.Mocked<ShipmentRepository>;
  let storeContext: StoreContext;
  let useCase: TrackShipmentUseCase;

  beforeEach(() => {
    orders = {
      create: jest.fn(),
      findById: jest.fn(),
      findByOrderNumber: jest.fn(),
      list: jest.fn(),
      changeStatus: jest.fn(),
      listByCustomerId: jest.fn(),
      associateGuestOrders: jest.fn(),
      addNote: jest.fn(),
      updatePaymentStatus: jest.fn(),
    };
    shipments = {
      create: jest.fn(),
      findById: jest.fn(),
      findByOrderId: jest.fn(),
      dispatch: jest.fn(),
      markDelivered: jest.fn(),
      appendTrackingEvent: jest.fn(),
      list: jest.fn(),
    };
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;

    useCase = new TrackShipmentUseCase(orders, shipments, storeContext);
  });

  it('returns the shipment when the order number and email both match', async () => {
    orders.findByOrderNumber.mockResolvedValue(buildOrder());
    shipments.findByOrderId.mockResolvedValue(buildShipment());

    const result = await useCase.execute({ orderNumber: 'ORD-20260802-ABCD1234', email: 'demo@example.com' });

    expect(result.id).toBe('shipment-1');
  });

  it('matches the email case-insensitively', async () => {
    orders.findByOrderNumber.mockResolvedValue(buildOrder());
    shipments.findByOrderId.mockResolvedValue(buildShipment());

    const result = await useCase.execute({ orderNumber: 'ORD-20260802-ABCD1234', email: 'DEMO@EXAMPLE.COM' });

    expect(result.id).toBe('shipment-1');
  });

  it('throws the identical ShipmentNotFoundError for an unknown order number as for a wrong email on a real order (anti-enumeration)', async () => {
    const sameOrderNumber = 'ORD-20260802-ABCD1234';

    orders.findByOrderNumber.mockResolvedValueOnce(null);
    let unknownOrderError: unknown;
    try {
      await useCase.execute({ orderNumber: sameOrderNumber, email: 'demo@example.com' });
    } catch (error) {
      unknownOrderError = error;
    }

    orders.findByOrderNumber.mockResolvedValueOnce(buildOrder());
    let wrongEmailError: unknown;
    try {
      await useCase.execute({ orderNumber: sameOrderNumber, email: 'someone-else@example.com' });
    } catch (error) {
      wrongEmailError = error;
    }

    expect(unknownOrderError).toBeInstanceOf(ShipmentNotFoundError);
    expect(wrongEmailError).toBeInstanceOf(ShipmentNotFoundError);
    expect((unknownOrderError as Error).constructor).toBe((wrongEmailError as Error).constructor);
    expect((unknownOrderError as Error).message).toBe((wrongEmailError as Error).message);
    expect(shipments.findByOrderId).not.toHaveBeenCalled();
  });

  it('throws ShipmentNotFoundError when the order matches but has no shipment yet', async () => {
    orders.findByOrderNumber.mockResolvedValue(buildOrder());
    shipments.findByOrderId.mockResolvedValue(null);

    await expect(
      useCase.execute({ orderNumber: 'ORD-20260802-ABCD1234', email: 'demo@example.com' }),
    ).rejects.toThrow(ShipmentNotFoundError);
  });
});
