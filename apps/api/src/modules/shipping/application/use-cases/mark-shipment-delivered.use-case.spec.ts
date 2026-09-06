import { ActorType } from '@za/types';
import { MarkShipmentDeliveredUseCase } from './mark-shipment-delivered.use-case';
import type { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import type { AdvanceOrderStatusUseCase } from '../../../orders/application/use-cases/advance-order-status.use-case';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Shipment } from '../../domain/entities/shipment.entity';
import { Order } from '../../../orders/domain/entities/order.entity';
import { SHIPMENT_STATUS } from '../../domain/constants/shipment-status.constants';
import { ORDER_STATUS } from '../../../orders/domain/constants/order-status.constants';
import { PAYMENT_METHOD } from '../../../orders/domain/constants/payment-method.constants';
import { PAYMENT_STATUS } from '../../../orders/domain/constants/payment-status.constants';
import { ShipmentNotFoundError } from '../../domain/errors/shipping.errors';

function buildShipment(overrides: Partial<{ status: string }> = {}): Shipment {
  return Shipment.reconstitute({
    id: 'shipment-1',
    storeId: 'store-1',
    orderId: 'order-1',
    shippingMethodId: 'method-1',
    status: (overrides.status ?? SHIPMENT_STATUS.IN_TRANSIT) as never,
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

function buildOrder(): Order {
  return Order.reconstitute({
    id: 'order-1',
    storeId: 'store-1',
    orderNumber: 'ORD-20260802-ABCD1234',
    status: ORDER_STATUS.DELIVERED,
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

describe('MarkShipmentDeliveredUseCase', () => {
  let shipments: jest.Mocked<ShipmentRepository>;
  let advanceOrderStatus: jest.Mocked<AdvanceOrderStatusUseCase>;
  let storeContext: StoreContext;
  let useCase: MarkShipmentDeliveredUseCase;
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
    advanceOrderStatus = { execute: jest.fn() } as unknown as jest.Mocked<AdvanceOrderStatusUseCase>;
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;

    shipments.findById.mockResolvedValue(buildShipment());
    shipments.markDelivered.mockResolvedValue(buildShipment({ status: SHIPMENT_STATUS.DELIVERED }));
    advanceOrderStatus.execute.mockResolvedValue(buildOrder());

    useCase = new MarkShipmentDeliveredUseCase(shipments, advanceOrderStatus, storeContext);
  });

  it('throws ShipmentNotFoundError for an unknown shipment', async () => {
    shipments.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ shipmentId: 'missing', actor }),
    ).rejects.toThrow(ShipmentNotFoundError);
    expect(shipments.markDelivered).not.toHaveBeenCalled();
  });

  it('marks the shipment delivered and advances the linked order to DELIVERED', async () => {
    const result = await useCase.execute({ shipmentId: 'shipment-1', actor });

    expect(shipments.markDelivered).toHaveBeenCalledWith('shipment-1', actor);
    expect(advanceOrderStatus.execute).toHaveBeenCalledWith({ orderId: 'order-1', status: ORDER_STATUS.DELIVERED, actor });
    expect(result.status).toBe(SHIPMENT_STATUS.DELIVERED);
  });
});
