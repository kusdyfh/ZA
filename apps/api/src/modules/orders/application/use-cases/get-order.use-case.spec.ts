import { GetOrderUseCase } from './get-order.use-case';
import type { OrderRepository } from '../../domain/repositories/order.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Order } from '../../domain/entities/order.entity';
import { ORDER_STATUS } from '../../domain/constants/order-status.constants';
import { PAYMENT_METHOD } from '../../domain/constants/payment-method.constants';
import { PAYMENT_STATUS } from '../../domain/constants/payment-status.constants';
import { OrderNotFoundError } from '../../domain/errors/order.errors';

function buildOrder(): Order {
  return Order.reconstitute({
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
    items: [],
    statusHistory: [],
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('GetOrderUseCase', () => {
  let orders: jest.Mocked<OrderRepository>;
  let storeContext: StoreContext;
  let useCase: GetOrderUseCase;

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
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    useCase = new GetOrderUseCase(orders, storeContext);
  });

  it('returns the order when found', async () => {
    orders.findById.mockResolvedValue(buildOrder());

    const result = await useCase.execute({ orderId: 'order-1' });

    expect(orders.findById).toHaveBeenCalledWith('store-1', 'order-1');
    expect(result.id).toBe('order-1');
  });

  it('throws OrderNotFoundError when the order does not exist', async () => {
    orders.findById.mockResolvedValue(null);

    await expect(useCase.execute({ orderId: 'missing' })).rejects.toThrow(OrderNotFoundError);
  });
});
