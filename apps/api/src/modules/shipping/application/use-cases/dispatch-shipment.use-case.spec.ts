import { ActorType } from '@za/types';
import { DispatchShipmentUseCase } from './dispatch-shipment.use-case';
import type { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import type { ShippingProviderPort } from '../../domain/ports/shipping-provider.port';
import type { GetOrderUseCase } from '../../../orders/application/use-cases/get-order.use-case';
import type { AdvanceOrderStatusUseCase } from '../../../orders/application/use-cases/advance-order-status.use-case';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Shipment } from '../../domain/entities/shipment.entity';
import { Order } from '../../../orders/domain/entities/order.entity';
import { SHIPMENT_STATUS } from '../../domain/constants/shipment-status.constants';
import { ORDER_STATUS, type OrderStatusValue } from '../../../orders/domain/constants/order-status.constants';
import { PAYMENT_METHOD } from '../../../orders/domain/constants/payment-method.constants';
import { PAYMENT_STATUS } from '../../../orders/domain/constants/payment-status.constants';
import { ShipmentNotFoundError, TrackingNumberRequiredError } from '../../domain/errors/shipping.errors';

function buildShipment(overrides: Partial<{ status: string }> = {}): Shipment {
  return Shipment.reconstitute({
    id: 'shipment-1',
    storeId: 'store-1',
    orderId: 'order-1',
    shippingMethodId: 'method-1',
    status: (overrides.status ?? SHIPMENT_STATUS.PENDING) as never,
    carrierName: null,
    trackingNumber: null,
    trackingUrl: null,
    labelUrl: null,
    dispatchedAt: null,
    deliveredAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    trackingEvents: [],
  });
}

function buildOrder(status: OrderStatusValue = ORDER_STATUS.CONFIRMED): Order {
  return Order.reconstitute({
    id: 'order-1',
    storeId: 'store-1',
    orderNumber: 'ORD-20260802-ABCD1234',
    status,
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

describe('DispatchShipmentUseCase', () => {
  let shipments: jest.Mocked<ShipmentRepository>;
  let shippingProvider: jest.Mocked<ShippingProviderPort>;
  let getOrder: jest.Mocked<GetOrderUseCase>;
  let advanceOrderStatus: jest.Mocked<AdvanceOrderStatusUseCase>;
  let storeContext: StoreContext;
  let useCase: DispatchShipmentUseCase;
  const actor = { actorId: 'admin-1', actorType: ActorType.ADMIN };

  beforeEach(() => {
    shipments = {
      create: jest.fn(),
      findById: jest.fn(),
      findByOrderId: jest.fn(),
      dispatch: jest.fn(),
      markDelivered: jest.fn(),
      appendTrackingEvent: jest.fn(),
      list: jest.fn(),
    };
    shippingProvider = {
      provider: 'MANUAL',
      createLabel: jest.fn(),
    };
    getOrder = { execute: jest.fn() } as unknown as jest.Mocked<GetOrderUseCase>;
    advanceOrderStatus = { execute: jest.fn() } as unknown as jest.Mocked<AdvanceOrderStatusUseCase>;
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;

    shipments.findById.mockResolvedValue(buildShipment());
    shippingProvider.createLabel.mockResolvedValue({ trackingUrl: 'https://track.example.com/TRK-1', labelUrl: null });
    shipments.dispatch.mockResolvedValue(buildShipment({ status: SHIPMENT_STATUS.IN_TRANSIT }));
    getOrder.execute.mockResolvedValue(buildOrder());
    advanceOrderStatus.execute.mockResolvedValue(buildOrder(ORDER_STATUS.SHIPPED));

    useCase = new DispatchShipmentUseCase(shipments, shippingProvider, getOrder, advanceOrderStatus, storeContext);
  });

  it('rejects a missing/blank tracking number before touching the repository', async () => {
    await expect(
      useCase.execute({ shipmentId: 'shipment-1', trackingNumber: '', actor }),
    ).rejects.toThrow(TrackingNumberRequiredError);
    expect(shipments.findById).not.toHaveBeenCalled();
  });

  it('throws ShipmentNotFoundError for an unknown shipment', async () => {
    shipments.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ shipmentId: 'missing', trackingNumber: 'TRK-1', actor }),
    ).rejects.toThrow(ShipmentNotFoundError);
  });

  it('walks a freshly-confirmed order through every intermediate status before dispatching the shipment', async () => {
    getOrder.execute.mockResolvedValue(buildOrder(ORDER_STATUS.CONFIRMED));

    const result = await useCase.execute({ shipmentId: 'shipment-1', trackingNumber: 'TRK-1', carrierName: 'Aramex', actor });

    expect(advanceOrderStatus.execute).toHaveBeenNthCalledWith(1, { orderId: 'order-1', status: ORDER_STATUS.PREPARING, actor });
    expect(advanceOrderStatus.execute).toHaveBeenNthCalledWith(2, { orderId: 'order-1', status: ORDER_STATUS.PACKED, actor });
    expect(advanceOrderStatus.execute).toHaveBeenNthCalledWith(3, { orderId: 'order-1', status: ORDER_STATUS.SHIPPED, actor });
    expect(advanceOrderStatus.execute).toHaveBeenCalledTimes(3);

    expect(shippingProvider.createLabel).toHaveBeenCalledWith({ trackingNumber: 'TRK-1', carrierName: 'Aramex' });
    expect(shipments.dispatch).toHaveBeenCalledWith(
      'shipment-1',
      {
        trackingNumber: 'TRK-1',
        carrierName: 'Aramex',
        trackingUrl: 'https://track.example.com/TRK-1',
        labelUrl: null,
      },
      actor,
    );
    expect(result.status).toBe(SHIPMENT_STATUS.IN_TRANSIT);
  });

  it('only advances the remaining hop when the order is already PACKED', async () => {
    getOrder.execute.mockResolvedValue(buildOrder(ORDER_STATUS.PACKED));

    await useCase.execute({ shipmentId: 'shipment-1', trackingNumber: 'TRK-1', carrierName: 'Aramex', actor });

    expect(advanceOrderStatus.execute).toHaveBeenCalledTimes(1);
    expect(advanceOrderStatus.execute).toHaveBeenCalledWith({ orderId: 'order-1', status: ORDER_STATUS.SHIPPED, actor });
  });

  it('advances the order to SHIPPED before mutating the shipment, so a failed order-status walk never leaves the shipment dispatched', async () => {
    getOrder.execute.mockResolvedValue(buildOrder(ORDER_STATUS.CONFIRMED));
    advanceOrderStatus.execute.mockRejectedValueOnce(new Error('illegal transition'));

    await expect(
      useCase.execute({ shipmentId: 'shipment-1', trackingNumber: 'TRK-1', actor }),
    ).rejects.toThrow('illegal transition');

    expect(shipments.dispatch).not.toHaveBeenCalled();
  });

  it('defaults carrierName to null when omitted', async () => {
    await useCase.execute({ shipmentId: 'shipment-1', trackingNumber: 'TRK-1', actor });

    expect(shippingProvider.createLabel).toHaveBeenCalledWith({ trackingNumber: 'TRK-1', carrierName: null });
  });
});
