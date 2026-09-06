import { AssociateGuestOrdersUseCase } from './associate-guest-orders.use-case';
import type { OrderRepository } from '../../../orders/domain/repositories/order.repository';

describe('AssociateGuestOrdersUseCase', () => {
  let orders: jest.Mocked<OrderRepository>;
  let useCase: AssociateGuestOrdersUseCase;

  beforeEach(() => {
    orders = {
      create: jest.fn(),
      findById: jest.fn(),
      findByOrderNumber: jest.fn(),
      list: jest.fn(),
      changeStatus: jest.fn(),
      addNote: jest.fn(),
      updatePaymentStatus: jest.fn(),
      listByCustomerId: jest.fn(),
      associateGuestOrders: jest.fn(),
    };
    useCase = new AssociateGuestOrdersUseCase(orders);
  });

  it('delegates to the repository and returns the count of linked orders', async () => {
    orders.associateGuestOrders.mockResolvedValue(3);

    const result = await useCase.execute({
      customerId: 'customer-1',
      email: 'jane@example.com',
      storeId: 'store-1',
    });

    expect(result).toBe(3);
    expect(orders.associateGuestOrders).toHaveBeenCalledWith('store-1', 'jane@example.com', 'customer-1');
  });
});
