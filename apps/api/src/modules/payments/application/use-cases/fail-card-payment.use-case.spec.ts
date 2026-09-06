import { FailCardPaymentUseCase } from './fail-card-payment.use-case';
import type { PaymentSessionRepository } from '../../domain/repositories/payment-session.repository';
import type { PaymentTransactionRepository } from '../../domain/repositories/payment-transaction.repository';
import type { ReleaseStockReservationUseCase } from '../../../inventory/application/use-cases/release-stock-reservation.use-case';
import { PaymentSession } from '../../domain/entities/payment-session.entity';
import { StockReservation } from '../../../inventory/domain/entities/stock-reservation.entity';
import { STOCK_RESERVATION_STATUS } from '../../../inventory/domain/constants/stock-reservation-status.constants';
import { PAYMENT_PROVIDER } from '../../domain/constants/payment-provider.constants';
import { PAYMENT_SESSION_STATUS } from '../../domain/constants/payment-session-status.constants';
import { PAYMENT_TRANSACTION_STATUS, PAYMENT_TRANSACTION_TYPE } from '../../domain/constants/payment-transaction.constants';
import { PaymentSessionNotFoundError } from '../../domain/errors/payment.errors';
import type { PendingOrderSnapshot } from '../../domain/entities/pending-order-snapshot';

function buildSnapshot(overrides: Partial<PendingOrderSnapshot> = {}): PendingOrderSnapshot {
  return {
    storeId: 'store-1',
    orderNumber: 'ORD-20260802-ABCD1234',
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
    paymentMethod: 'CARD',
    items: [],
    cartId: 'cart-1',
    reservationIds: ['res-1'],
    ...overrides,
  };
}

function buildSession(overrides: Partial<{ status: string; snapshot: PendingOrderSnapshot }> = {}): PaymentSession {
  return PaymentSession.reconstitute({
    id: 'session-1',
    storeId: 'store-1',
    provider: PAYMENT_PROVIDER.STRIPE,
    status: (overrides.status ?? PAYMENT_SESSION_STATUS.PENDING) as never,
    providerSessionId: 'pi_123',
    pendingOrderSnapshot: overrides.snapshot ?? buildSnapshot(),
    orderId: null,
    amount: 83000,
    currencyCode: 'IQD',
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildReservation(): StockReservation {
  return StockReservation.reconstitute({
    id: 'res-1',
    variantId: 'variant-1',
    warehouseId: 'wh-1',
    cartId: 'cart-1',
    quantity: 2,
    status: STOCK_RESERVATION_STATUS.RELEASED,
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    confirmedAt: null,
    releasedAt: new Date(),
  });
}

describe('FailCardPaymentUseCase', () => {
  let paymentSessions: jest.Mocked<PaymentSessionRepository>;
  let paymentTransactions: jest.Mocked<PaymentTransactionRepository>;
  let releaseStockReservation: jest.Mocked<ReleaseStockReservationUseCase>;
  let useCase: FailCardPaymentUseCase;

  beforeEach(() => {
    paymentSessions = {
      create: jest.fn(),
      findById: jest.fn(),
      findByProviderSessionId: jest.fn(),
      markSucceeded: jest.fn(),
      markFailed: jest.fn(),
    };
    paymentTransactions = {
      create: jest.fn(),
      listByOrderId: jest.fn(),
    };
    releaseStockReservation = { execute: jest.fn() } as unknown as jest.Mocked<ReleaseStockReservationUseCase>;

    releaseStockReservation.execute.mockResolvedValue(buildReservation());
    paymentSessions.markFailed.mockResolvedValue(buildSession({ status: PAYMENT_SESSION_STATUS.FAILED }));

    useCase = new FailCardPaymentUseCase(paymentSessions, paymentTransactions, releaseStockReservation);
  });

  it('throws PaymentSessionNotFoundError for an unknown provider session id', async () => {
    paymentSessions.findByProviderSessionId.mockResolvedValue(null);

    await expect(
      useCase.execute({ providerSessionId: 'pi_missing', reason: 'card_declined' }),
    ).rejects.toThrow(PaymentSessionNotFoundError);
  });

  it('is a silent no-op for a session that is no longer PENDING (idempotent)', async () => {
    paymentSessions.findByProviderSessionId.mockResolvedValue(buildSession({ status: PAYMENT_SESSION_STATUS.FAILED }));

    await useCase.execute({ providerSessionId: 'pi_123', reason: 'card_declined' });

    expect(releaseStockReservation.execute).not.toHaveBeenCalled();
    expect(paymentTransactions.create).not.toHaveBeenCalled();
    expect(paymentSessions.markFailed).not.toHaveBeenCalled();
  });

  it('releases every reservation listed in the snapshot, records a FAILURE transaction, and marks the session failed', async () => {
    paymentSessions.findByProviderSessionId.mockResolvedValue(
      buildSession({ snapshot: buildSnapshot({ reservationIds: ['res-1', 'res-2'] }) }),
    );

    await useCase.execute({ providerSessionId: 'pi_123', reason: 'card_declined' });

    expect(releaseStockReservation.execute).toHaveBeenCalledTimes(2);
    expect(releaseStockReservation.execute).toHaveBeenNthCalledWith(1, { reservationId: 'res-1' });
    expect(releaseStockReservation.execute).toHaveBeenNthCalledWith(2, { reservationId: 'res-2' });
    expect(paymentTransactions.create).toHaveBeenCalledWith({
      storeId: 'store-1',
      paymentSessionId: 'session-1',
      provider: PAYMENT_PROVIDER.STRIPE,
      type: PAYMENT_TRANSACTION_TYPE.FAILURE,
      status: PAYMENT_TRANSACTION_STATUS.FAILED,
      amount: 83000,
      currencyCode: 'IQD',
      failureReason: 'card_declined',
    });
    expect(paymentSessions.markFailed).toHaveBeenCalledWith('session-1');
  });

  it('never creates an Order or touches OrderRepository — there is nothing to cancel', async () => {
    paymentSessions.findByProviderSessionId.mockResolvedValue(buildSession());

    await useCase.execute({ providerSessionId: 'pi_123', reason: null });

    expect(paymentTransactions.create).toHaveBeenCalledWith(
      expect.objectContaining({ failureReason: null }),
    );
  });
});
