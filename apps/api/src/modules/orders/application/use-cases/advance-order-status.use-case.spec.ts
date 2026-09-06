import { ActorType } from '@za/types';
import { AdvanceOrderStatusUseCase } from './advance-order-status.use-case';
import type { OrderRepository } from '../../domain/repositories/order.repository';
import { Order } from '../../domain/entities/order.entity';
import { ORDER_STATUS } from '../../domain/constants/order-status.constants';
import { PAYMENT_METHOD } from '../../domain/constants/payment-method.constants';
import { PAYMENT_STATUS } from '../../domain/constants/payment-status.constants';
import { UseCancelOrderUseCaseError } from '../../domain/errors/order.errors';

function buildOrder(status: string): Order {
  return Order.reconstitute({
    id: 'order-1',
    storeId: 'store-1',
    orderNumber: 'ORD-20260802-ABCD1234',
    status: status as never,
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
    paymentStatus: PAYMENT_STATUS.PAID,
    cancelReason: null,
    items: [],
    statusHistory: [],
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('AdvanceOrderStatusUseCase', () => {
  let orders: jest.Mocked<OrderRepository>;
  let useCase: AdvanceOrderStatusUseCase;

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
    useCase = new AdvanceOrderStatusUseCase(orders);
  });

  it('delegates a normal fulfillment transition to the repository', async () => {
    const actor = { actorId: 'wh-1', actorType: ActorType.ADMIN };
    orders.changeStatus.mockResolvedValue(buildOrder(ORDER_STATUS.PREPARING));

    await useCase.execute({
      orderId: 'order-1',
      status: ORDER_STATUS.PREPARING,
      note: 'Picking started.',
      actor,
    });

    expect(orders.changeStatus).toHaveBeenCalledWith(
      'order-1',
      ORDER_STATUS.PREPARING,
      'Picking started.',
      actor,
    );
  });

  it('rejects CANCELLED — must go through CancelOrderUseCase', async () => {
    await expect(
      useCase.execute({
        orderId: 'order-1',
        status: ORDER_STATUS.CANCELLED,
        actor: { actorId: null, actorType: ActorType.SYSTEM },
      }),
    ).rejects.toThrow(UseCancelOrderUseCaseError);
    expect(orders.changeStatus).not.toHaveBeenCalled();
  });
});
