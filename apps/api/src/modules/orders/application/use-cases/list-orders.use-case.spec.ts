import { ListOrdersUseCase } from './list-orders.use-case';
import type { OrderRepository } from '../../domain/repositories/order.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Order } from '../../domain/entities/order.entity';
import { ORDER_STATUS } from '../../domain/constants/order-status.constants';
import { PAYMENT_METHOD } from '../../domain/constants/payment-method.constants';
import { PAYMENT_STATUS } from '../../domain/constants/payment-status.constants';

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

describe('ListOrdersUseCase', () => {
  let orders: jest.Mocked<OrderRepository>;
  let storeContext: StoreContext;
  let useCase: ListOrdersUseCase;

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
    useCase = new ListOrdersUseCase(orders, storeContext);
  });

  it('lists every order for the current store', async () => {
    orders.list.mockResolvedValue([buildOrder()]);

    const result = await useCase.execute();

    expect(orders.list).toHaveBeenCalledWith('store-1', { status: undefined });
    expect(result).toHaveLength(1);
  });

  it('passes a status filter through to the repository', async () => {
    orders.list.mockResolvedValue([]);

    await useCase.execute({ status: ORDER_STATUS.CONFIRMED });

    expect(orders.list).toHaveBeenCalledWith('store-1', { status: ORDER_STATUS.CONFIRMED });
  });
});
