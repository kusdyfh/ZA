import { ActorType } from '@za/types';
import { IssueRefundUseCase } from './issue-refund.use-case';
import type { OrderRepository } from '../../../orders/domain/repositories/order.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import type { RefundRepository } from '../../domain/repositories/refund.repository';
import type { PaymentTransactionRepository } from '../../domain/repositories/payment-transaction.repository';
import type { PaymentProviderRegistry, PaymentProviderPort } from '../../domain/ports/payment-provider.port';
import { Order } from '../../../orders/domain/entities/order.entity';
import { Refund } from '../../domain/entities/refund.entity';
import { PaymentTransaction } from '../../domain/entities/payment-transaction.entity';
import { ORDER_STATUS } from '../../../orders/domain/constants/order-status.constants';
import { PAYMENT_METHOD } from '../../../orders/domain/constants/payment-method.constants';
import { PAYMENT_STATUS } from '../../../orders/domain/constants/payment-status.constants';
import { PAYMENT_PROVIDER } from '../../domain/constants/payment-provider.constants';
import { PAYMENT_TRANSACTION_STATUS, PAYMENT_TRANSACTION_TYPE } from '../../domain/constants/payment-transaction.constants';
import { REFUND_METHOD, REFUND_STATUS } from '../../domain/constants/refund-status.constants';
import {
  InvalidRefundReasonError,
  OrderNotRefundableError,
  RefundAmountExceedsOrderTotalError,
} from '../../domain/errors/payment.errors';
import { OrderNotFoundError } from '../../../orders/domain/errors/order.errors';

function buildOrder(overrides: Partial<{ status: string; paymentMethod: string; total: number }> = {}): Order {
  return Order.reconstitute({
    id: 'order-1',
    storeId: 'store-1',
    orderNumber: 'ORD-20260802-ABCD1234',
    status: (overrides.status ?? ORDER_STATUS.CANCELLED) as never,
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
    total: overrides.total ?? 83000,
    currencyCode: 'IQD',
    paymentMethod: (overrides.paymentMethod ?? PAYMENT_METHOD.COD) as never,
    paymentStatus: PAYMENT_STATUS.PAID,
    cancelReason: null,
    items: [],
    statusHistory: [],
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildRefund(): Refund {
  return Refund.reconstitute({
    id: 'refund-1',
    storeId: 'store-1',
    orderId: 'order-1',
    paymentTransactionId: 'txn-1',
    amount: 20000,
    reason: 'Customer returned item',
    status: REFUND_STATUS.PENDING,
    method: REFUND_METHOD.STORE_CREDIT,
    requestedByActorId: 'admin-1',
    requestedByActorType: ActorType.ADMIN,
    completedAt: null,
    createdAt: new Date(),
  });
}

function buildTransaction(overrides: Partial<{ type: string; providerReference: string | null }> = {}): PaymentTransaction {
  return PaymentTransaction.reconstitute({
    id: 'txn-existing',
    storeId: 'store-1',
    paymentSessionId: 'session-1',
    orderId: 'order-1',
    provider: PAYMENT_PROVIDER.STRIPE,
    type: (overrides.type ?? PAYMENT_TRANSACTION_TYPE.CAPTURE) as never,
    status: PAYMENT_TRANSACTION_STATUS.SUCCEEDED,
    amount: 83000,
    currencyCode: 'IQD',
    providerReference: overrides.providerReference === undefined ? 'ch_123' : overrides.providerReference,
    failureReason: null,
    createdAt: new Date(),
  });
}

describe('IssueRefundUseCase', () => {
  let orders: jest.Mocked<OrderRepository>;
  let refunds: jest.Mocked<RefundRepository>;
  let paymentTransactions: jest.Mocked<PaymentTransactionRepository>;
  let providers: jest.Mocked<PaymentProviderRegistry>;
  let stripeProvider: jest.Mocked<PaymentProviderPort>;
  let storeContext: StoreContext;
  let useCase: IssueRefundUseCase;
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
    refunds = {
      create: jest.fn(),
      listByOrderId: jest.fn(),
      sumCompletedByOrderId: jest.fn(),
    };
    paymentTransactions = {
      create: jest.fn(),
      listByOrderId: jest.fn(),
    };
    stripeProvider = {
      provider: PAYMENT_PROVIDER.STRIPE,
      createSession: jest.fn(),
      verifyWebhookSignature: jest.fn(),
      parseWebhookEvent: jest.fn(),
      refund: jest.fn(),
    };
    providers = new Map([[PAYMENT_PROVIDER.STRIPE, stripeProvider]]) as unknown as jest.Mocked<PaymentProviderRegistry>;
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;

    refunds.sumCompletedByOrderId.mockResolvedValue(0);
    refunds.create.mockResolvedValue(buildRefund());
    paymentTransactions.create.mockResolvedValue(buildTransaction({ type: PAYMENT_TRANSACTION_TYPE.REFUND }));
    orders.updatePaymentStatus.mockResolvedValue(buildOrder());

    useCase = new IssueRefundUseCase(orders, refunds, paymentTransactions, providers, storeContext);
  });

  it('rejects a missing/blank reason before touching any repository', async () => {
    await expect(
      useCase.execute({ orderId: 'order-1', amount: 1000, reason: '', actor }),
    ).rejects.toThrow(InvalidRefundReasonError);
    expect(orders.findById).not.toHaveBeenCalled();
  });

  it('throws OrderNotFoundError for an unknown order', async () => {
    orders.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ orderId: 'missing', amount: 1000, reason: 'Some reason', actor }),
    ).rejects.toThrow(OrderNotFoundError);
  });

  it('rejects refunding an order that is not CANCELLED/RETURNED', async () => {
    orders.findById.mockResolvedValue(buildOrder({ status: ORDER_STATUS.CONFIRMED }));

    await expect(
      useCase.execute({ orderId: 'order-1', amount: 1000, reason: 'Some reason', actor }),
    ).rejects.toThrow(OrderNotRefundableError);
  });

  it('rejects an amount that exceeds the remaining refundable balance', async () => {
    orders.findById.mockResolvedValue(buildOrder({ total: 1000 }));
    refunds.sumCompletedByOrderId.mockResolvedValue(500);

    await expect(
      useCase.execute({ orderId: 'order-1', amount: 600, reason: 'Some reason', actor }),
    ).rejects.toThrow(RefundAmountExceedsOrderTotalError);
  });

  it('records a STORE_CREDIT refund requiring manual follow-up for a COD order, never calling the Stripe provider', async () => {
    orders.findById.mockResolvedValue(buildOrder({ paymentMethod: PAYMENT_METHOD.COD }));

    await useCase.execute({ orderId: 'order-1', amount: 20000, reason: 'Customer returned item', actor });

    expect(stripeProvider.refund).not.toHaveBeenCalled();
    expect(paymentTransactions.create).toHaveBeenCalledWith(
      expect.objectContaining({ provider: PAYMENT_PROVIDER.COD, type: PAYMENT_TRANSACTION_TYPE.REFUND }),
    );
    expect(refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ method: REFUND_METHOD.STORE_CREDIT, status: REFUND_STATUS.PENDING }),
    );
  });

  it('calls the Stripe provider to refund a CARD order using the original capture reference', async () => {
    orders.findById.mockResolvedValue(buildOrder({ paymentMethod: PAYMENT_METHOD.CARD }));
    paymentTransactions.listByOrderId.mockResolvedValue([buildTransaction({ type: PAYMENT_TRANSACTION_TYPE.CAPTURE, providerReference: 'ch_123' })]);
    stripeProvider.refund.mockResolvedValue({ succeeded: true, providerReference: 're_123', requiresManualFollowUp: false });

    await useCase.execute({ orderId: 'order-1', amount: 20000, reason: 'Customer returned item', actor });

    expect(stripeProvider.refund).toHaveBeenCalledWith({
      providerReference: 'ch_123',
      amount: 20000,
      currencyCode: 'IQD',
    });
    expect(refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ method: REFUND_METHOD.STRIPE, status: REFUND_STATUS.COMPLETED }),
    );
    const createArgs = refunds.create.mock.calls[0]![0];
    expect(createArgs.completedAt).toBeInstanceOf(Date);
  });

  it('marks paymentStatus REFUNDED when the cumulative refund reaches the order total', async () => {
    orders.findById.mockResolvedValue(buildOrder({ total: 20000 }));
    refunds.sumCompletedByOrderId.mockResolvedValue(0);

    await useCase.execute({ orderId: 'order-1', amount: 20000, reason: 'Full refund', actor });

    expect(orders.updatePaymentStatus).toHaveBeenCalledWith(
      'order-1',
      PAYMENT_STATUS.REFUNDED,
      expect.stringContaining('Full refund'),
      actor,
    );
  });

  it('marks paymentStatus PARTIALLY_REFUNDED when the cumulative refund is below the order total', async () => {
    orders.findById.mockResolvedValue(buildOrder({ total: 20000 }));
    refunds.sumCompletedByOrderId.mockResolvedValue(0);

    await useCase.execute({ orderId: 'order-1', amount: 5000, reason: 'Partial refund', actor });

    expect(orders.updatePaymentStatus).toHaveBeenCalledWith(
      'order-1',
      PAYMENT_STATUS.PARTIALLY_REFUNDED,
      expect.stringContaining('Partial refund'),
      actor,
    );
  });
});
