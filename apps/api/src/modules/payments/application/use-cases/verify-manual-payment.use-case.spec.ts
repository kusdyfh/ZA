import { ActorType } from '@za/types';
import { VerifyManualPaymentUseCase } from './verify-manual-payment.use-case';
import type { OrderRepository } from '../../../orders/domain/repositories/order.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import type { PaymentTransactionRepository } from '../../domain/repositories/payment-transaction.repository';
import { Order } from '../../../orders/domain/entities/order.entity';
import { PaymentTransaction } from '../../domain/entities/payment-transaction.entity';
import { ORDER_STATUS } from '../../../orders/domain/constants/order-status.constants';
import { PAYMENT_METHOD } from '../../../orders/domain/constants/payment-method.constants';
import { PAYMENT_STATUS } from '../../../orders/domain/constants/payment-status.constants';
import { PAYMENT_PROVIDER } from '../../domain/constants/payment-provider.constants';
import { PAYMENT_TRANSACTION_STATUS, PAYMENT_TRANSACTION_TYPE } from '../../domain/constants/payment-transaction.constants';
import { OrderNotFoundError } from '../../../orders/domain/errors/order.errors';

function buildOrder(status: string = ORDER_STATUS.SHIPPED): Order {
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
    paymentStatus: PAYMENT_STATUS.AWAITING_COLLECTION,
    cancelReason: null,
    items: [],
    statusHistory: [],
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildTransaction(): PaymentTransaction {
  return PaymentTransaction.reconstitute({
    id: 'txn-1',
    storeId: 'store-1',
    paymentSessionId: null,
    orderId: 'order-1',
    provider: PAYMENT_PROVIDER.COD,
    type: PAYMENT_TRANSACTION_TYPE.CAPTURE,
    status: PAYMENT_TRANSACTION_STATUS.SUCCEEDED,
    amount: 83000,
    currencyCode: 'IQD',
    providerReference: null,
    failureReason: null,
    createdAt: new Date(),
  });
}

describe('VerifyManualPaymentUseCase', () => {
  let orders: jest.Mocked<OrderRepository>;
  let paymentTransactions: jest.Mocked<PaymentTransactionRepository>;
  let storeContext: StoreContext;
  let useCase: VerifyManualPaymentUseCase;
  const actor = { actorId: 'admin-1', actorType: ActorType.ADMIN };

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
    paymentTransactions = {
      create: jest.fn(),
      listByOrderId: jest.fn(),
    };
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;

    orders.findById.mockResolvedValue(buildOrder());
    orders.updatePaymentStatus.mockResolvedValue(buildOrder());
    paymentTransactions.create.mockResolvedValue(buildTransaction());

    useCase = new VerifyManualPaymentUseCase(orders, paymentTransactions, storeContext);
  });

  it('throws OrderNotFoundError for an unknown order', async () => {
    orders.findById.mockResolvedValue(null);

    await expect(useCase.execute({ orderId: 'missing', actor })).rejects.toThrow(OrderNotFoundError);
    expect(orders.updatePaymentStatus).not.toHaveBeenCalled();
  });

  it('marks the payment PAID without requiring an order status transition', async () => {
    const order = await useCase.execute({ orderId: 'order-1', actor });

    expect(orders.updatePaymentStatus).toHaveBeenCalledWith(
      'order-1',
      PAYMENT_STATUS.PAID,
      'Cash on Delivery payment confirmed collected.',
      actor,
    );
    expect(orders.changeStatus).not.toHaveBeenCalled();
    expect(order).toBeInstanceOf(Order);
  });

  it('records a COD CAPTURE payment transaction for the full order total', async () => {
    await useCase.execute({ orderId: 'order-1', actor });

    expect(paymentTransactions.create).toHaveBeenCalledWith({
      storeId: 'store-1',
      orderId: 'order-1',
      provider: PAYMENT_PROVIDER.COD,
      type: PAYMENT_TRANSACTION_TYPE.CAPTURE,
      status: PAYMENT_TRANSACTION_STATUS.SUCCEEDED,
      amount: 83000,
      currencyCode: 'IQD',
    });
  });
});
