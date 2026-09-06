import { ActorType } from '@za/types';
import { GetOrderPaymentSummaryUseCase } from './get-order-payment-summary.use-case';
import type { PaymentTransactionRepository } from '../../domain/repositories/payment-transaction.repository';
import type { PaymentStatusHistoryRepository } from '../../domain/repositories/payment-status-history.repository';
import type { RefundRepository } from '../../domain/repositories/refund.repository';
import { PaymentTransaction } from '../../domain/entities/payment-transaction.entity';
import { PaymentStatusHistoryEntry } from '../../domain/entities/payment-status-history-entry.entity';
import { Refund } from '../../domain/entities/refund.entity';
import { PAYMENT_PROVIDER } from '../../domain/constants/payment-provider.constants';
import { PAYMENT_TRANSACTION_STATUS, PAYMENT_TRANSACTION_TYPE } from '../../domain/constants/payment-transaction.constants';
import { PAYMENT_STATUS } from '../../../orders/domain/constants/payment-status.constants';
import { REFUND_METHOD, REFUND_STATUS } from '../../domain/constants/refund-status.constants';

function buildTransaction(): PaymentTransaction {
  return PaymentTransaction.reconstitute({
    id: 'txn-1',
    storeId: 'store-1',
    paymentSessionId: 'session-1',
    orderId: 'order-1',
    provider: PAYMENT_PROVIDER.STRIPE,
    type: PAYMENT_TRANSACTION_TYPE.CAPTURE,
    status: PAYMENT_TRANSACTION_STATUS.SUCCEEDED,
    amount: 83000,
    currencyCode: 'IQD',
    providerReference: 'ch_123',
    failureReason: null,
    createdAt: new Date(),
  });
}

function buildHistoryEntry(): PaymentStatusHistoryEntry {
  return PaymentStatusHistoryEntry.reconstitute({
    id: 'hist-1',
    orderId: 'order-1',
    status: PAYMENT_STATUS.PAID,
    note: null,
    actorId: null,
    actorType: ActorType.SYSTEM,
    createdAt: new Date(),
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
    status: REFUND_STATUS.COMPLETED,
    method: REFUND_METHOD.STRIPE,
    requestedByActorId: 'admin-1',
    requestedByActorType: ActorType.ADMIN,
    completedAt: new Date(),
    createdAt: new Date(),
  });
}

describe('GetOrderPaymentSummaryUseCase', () => {
  let paymentTransactions: jest.Mocked<PaymentTransactionRepository>;
  let paymentStatusHistory: jest.Mocked<PaymentStatusHistoryRepository>;
  let refunds: jest.Mocked<RefundRepository>;
  let useCase: GetOrderPaymentSummaryUseCase;

  beforeEach(() => {
    paymentTransactions = {
      create: jest.fn(),
      listByOrderId: jest.fn(),
    };
    paymentStatusHistory = {
      append: jest.fn(),
      listByOrderId: jest.fn(),
    };
    refunds = {
      create: jest.fn(),
      listByOrderId: jest.fn(),
      sumCompletedByOrderId: jest.fn(),
    };

    useCase = new GetOrderPaymentSummaryUseCase(paymentTransactions, paymentStatusHistory, refunds);
  });

  it('aggregates transactions, status history, and refunds for the order in one call', async () => {
    paymentTransactions.listByOrderId.mockResolvedValue([buildTransaction()]);
    paymentStatusHistory.listByOrderId.mockResolvedValue([buildHistoryEntry()]);
    refunds.listByOrderId.mockResolvedValue([buildRefund()]);

    const result = await useCase.execute('order-1');

    expect(paymentTransactions.listByOrderId).toHaveBeenCalledWith('order-1');
    expect(paymentStatusHistory.listByOrderId).toHaveBeenCalledWith('order-1');
    expect(refunds.listByOrderId).toHaveBeenCalledWith('order-1');
    expect(result.transactions).toHaveLength(1);
    expect(result.statusHistory).toHaveLength(1);
    expect(result.refunds).toHaveLength(1);
  });

  it('returns empty lists when an order has no payment activity', async () => {
    paymentTransactions.listByOrderId.mockResolvedValue([]);
    paymentStatusHistory.listByOrderId.mockResolvedValue([]);
    refunds.listByOrderId.mockResolvedValue([]);

    const result = await useCase.execute('order-2');

    expect(result).toEqual({ transactions: [], statusHistory: [], refunds: [] });
  });
});
