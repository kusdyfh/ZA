import { ActorType } from '@za/types';
import { AddOrderNoteUseCase } from './add-order-note.use-case';
import type { OrderRepository } from '../../domain/repositories/order.repository';
import { Order } from '../../domain/entities/order.entity';
import { ORDER_STATUS } from '../../domain/constants/order-status.constants';
import { PAYMENT_METHOD } from '../../domain/constants/payment-method.constants';
import { PAYMENT_STATUS } from '../../domain/constants/payment-status.constants';
import { EmptyOrderNoteError } from '../../domain/errors/order.errors';

function buildOrder(): Order {
  return Order.reconstitute({
    id: 'order-1',
    storeId: 'store-1',
    orderNumber: 'ORD-20260802-ABCD1234',
    status: ORDER_STATUS.CONFIRMED,
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

describe('AddOrderNoteUseCase', () => {
  let orders: jest.Mocked<OrderRepository>;
  let useCase: AddOrderNoteUseCase;

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
    useCase = new AddOrderNoteUseCase(orders);
  });

  it('adds an internal note by default', async () => {
    const actor = { actorId: 'admin-1', actorType: ActorType.ADMIN };
    orders.addNote.mockResolvedValue(buildOrder());

    await useCase.execute({ orderId: 'order-1', body: 'Called customer.', actor });

    expect(orders.addNote).toHaveBeenCalledWith('order-1', 'Called customer.', true, actor);
  });

  it('adds a customer-visible note when isInternal is false', async () => {
    const actor = { actorId: 'admin-1', actorType: ActorType.ADMIN };
    orders.addNote.mockResolvedValue(buildOrder());

    await useCase.execute({ orderId: 'order-1', body: 'Shipping tomorrow.', isInternal: false, actor });

    expect(orders.addNote).toHaveBeenCalledWith('order-1', 'Shipping tomorrow.', false, actor);
  });

  it('rejects an empty note body before touching the repository', async () => {
    await expect(
      useCase.execute({
        orderId: 'order-1',
        body: '   ',
        actor: { actorId: 'admin-1', actorType: ActorType.ADMIN },
      }),
    ).rejects.toThrow(EmptyOrderNoteError);
    expect(orders.addNote).not.toHaveBeenCalled();
  });
});
