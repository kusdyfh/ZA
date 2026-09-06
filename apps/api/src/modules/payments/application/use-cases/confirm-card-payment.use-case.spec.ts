import { ActorType } from '@za/types';
import { ConfirmCardPaymentUseCase } from './confirm-card-payment.use-case';
import type { OrderRepository, CreateOrderItemData } from '../../../orders/domain/repositories/order.repository';
import type { PaymentSessionRepository } from '../../domain/repositories/payment-session.repository';
import type { PaymentTransactionRepository } from '../../domain/repositories/payment-transaction.repository';
import type { ShipmentRepository } from '../../../shipping/domain/repositories/shipment.repository';
import type { ConfirmStockReservationUseCase } from '../../../inventory/application/use-cases/confirm-stock-reservation.use-case';
import { Order } from '../../../orders/domain/entities/order.entity';
import { PaymentSession } from '../../domain/entities/payment-session.entity';
import { PaymentTransaction } from '../../domain/entities/payment-transaction.entity';
import { Shipment } from '../../../shipping/domain/entities/shipment.entity';
import { StockReservation } from '../../../inventory/domain/entities/stock-reservation.entity';
import { STOCK_RESERVATION_STATUS } from '../../../inventory/domain/constants/stock-reservation-status.constants';
import { ORDER_STATUS } from '../../../orders/domain/constants/order-status.constants';
import { PAYMENT_METHOD } from '../../../orders/domain/constants/payment-method.constants';
import { PAYMENT_STATUS } from '../../../orders/domain/constants/payment-status.constants';
import { PAYMENT_PROVIDER } from '../../domain/constants/payment-provider.constants';
import { PAYMENT_SESSION_STATUS } from '../../domain/constants/payment-session-status.constants';
import { PAYMENT_TRANSACTION_STATUS, PAYMENT_TRANSACTION_TYPE } from '../../domain/constants/payment-transaction.constants';
import { SHIPMENT_STATUS } from '../../../shipping/domain/constants/shipment-status.constants';
import { PaymentSessionNotFoundError, PaymentSessionNotPendingError } from '../../domain/errors/payment.errors';
import type { PendingOrderSnapshot } from '../../domain/entities/pending-order-snapshot';

const SNAPSHOT_ITEMS: CreateOrderItemData[] = [
  {
    variantId: 'variant-1',
    stockReservationId: 'res-1',
    productNameSnapshot: 'Classic V-Neck Scrub Top',
    skuSnapshot: 'ZA-TOP-VNECK-001-NVY-M',
    unitPrice: 39000,
    quantity: 2,
    lineTotal: 78000,
  },
];

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
    items: SNAPSHOT_ITEMS,
    cartId: 'cart-1',
    reservationIds: ['res-1'],
    ...overrides,
  };
}

function buildSession(overrides: Partial<{ status: string; orderId: string | null }> = {}): PaymentSession {
  return PaymentSession.reconstitute({
    id: 'session-1',
    storeId: 'store-1',
    provider: PAYMENT_PROVIDER.STRIPE,
    status: (overrides.status ?? PAYMENT_SESSION_STATUS.PENDING) as never,
    providerSessionId: 'pi_123',
    pendingOrderSnapshot: buildSnapshot(),
    orderId: overrides.orderId ?? null,
    amount: 83000,
    currencyCode: 'IQD',
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildOrder(overrides: Partial<{ id: string; status: string }> = {}): Order {
  return Order.reconstitute({
    id: overrides.id ?? 'order-1',
    storeId: 'store-1',
    orderNumber: 'ORD-20260802-ABCD1234',
    status: (overrides.status ?? ORDER_STATUS.CONFIRMED) as never,
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
    paymentMethod: PAYMENT_METHOD.CARD,
    paymentStatus: PAYMENT_STATUS.PAID,
    cancelReason: null,
    items: [],
    statusHistory: [],
    notes: [],
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
    status: STOCK_RESERVATION_STATUS.CONFIRMED,
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    confirmedAt: new Date(),
    releasedAt: null,
  });
}

function buildShipment(): Shipment {
  return Shipment.reconstitute({
    id: 'shipment-1',
    storeId: 'store-1',
    orderId: 'order-1',
    shippingMethodId: 'method-1',
    status: SHIPMENT_STATUS.PENDING,
    carrierName: null,
    trackingNumber: null,
    trackingUrl: null,
    labelUrl: null,
    dispatchedAt: null,
    deliveredAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    trackingEvents: [],
  });
}

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

describe('ConfirmCardPaymentUseCase', () => {
  let paymentSessions: jest.Mocked<PaymentSessionRepository>;
  let paymentTransactions: jest.Mocked<PaymentTransactionRepository>;
  let orders: jest.Mocked<OrderRepository>;
  let shipments: jest.Mocked<ShipmentRepository>;
  let confirmStockReservation: jest.Mocked<ConfirmStockReservationUseCase>;
  let useCase: ConfirmCardPaymentUseCase;

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
    shipments = {
      create: jest.fn(),
      findById: jest.fn(),
      findByOrderId: jest.fn(),
      dispatch: jest.fn(),
      markDelivered: jest.fn(),
      appendTrackingEvent: jest.fn(),
      list: jest.fn(),
    };
    confirmStockReservation = { execute: jest.fn() } as unknown as jest.Mocked<ConfirmStockReservationUseCase>;

    orders.create.mockResolvedValue(buildOrder());
    orders.changeStatus.mockResolvedValue(buildOrder());
    confirmStockReservation.execute.mockResolvedValue(buildReservation());
    shipments.create.mockResolvedValue(buildShipment());
    paymentTransactions.create.mockResolvedValue(buildTransaction());
    paymentSessions.markSucceeded.mockResolvedValue(buildSession({ status: PAYMENT_SESSION_STATUS.SUCCEEDED, orderId: 'order-1' }));

    useCase = new ConfirmCardPaymentUseCase(paymentSessions, paymentTransactions, orders, shipments, confirmStockReservation);
  });

  it('throws PaymentSessionNotFoundError for an unknown provider session id', async () => {
    paymentSessions.findByProviderSessionId.mockResolvedValue(null);

    await expect(
      useCase.execute({ providerSessionId: 'pi_missing', providerReference: null }),
    ).rejects.toThrow(PaymentSessionNotFoundError);
  });

  it('throws PaymentSessionNotPendingError for a FAILED session', async () => {
    paymentSessions.findByProviderSessionId.mockResolvedValue(buildSession({ status: PAYMENT_SESSION_STATUS.FAILED }));

    await expect(
      useCase.execute({ providerSessionId: 'pi_123', providerReference: 'ch_123' }),
    ).rejects.toThrow(PaymentSessionNotPendingError);
    expect(orders.create).not.toHaveBeenCalled();
  });

  it('is idempotent: a SUCCEEDED session with an existing order returns that order without recreating anything', async () => {
    paymentSessions.findByProviderSessionId.mockResolvedValue(
      buildSession({ status: PAYMENT_SESSION_STATUS.SUCCEEDED, orderId: 'order-1' }),
    );
    orders.findById.mockResolvedValue(buildOrder({ id: 'order-1' }));

    const result = await useCase.execute({ providerSessionId: 'pi_123', providerReference: 'ch_123' });

    expect(result.id).toBe('order-1');
    expect(orders.create).not.toHaveBeenCalled();
    expect(paymentTransactions.create).not.toHaveBeenCalled();
  });

  it('throws PaymentSessionNotPendingError when SUCCEEDED but the linked order can no longer be found', async () => {
    paymentSessions.findByProviderSessionId.mockResolvedValue(
      buildSession({ status: PAYMENT_SESSION_STATUS.SUCCEEDED, orderId: 'order-1' }),
    );
    orders.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ providerSessionId: 'pi_123', providerReference: 'ch_123' }),
    ).rejects.toThrow(PaymentSessionNotPendingError);
  });

  it('materializes the Order from the pendingOrderSnapshot, confirms reservations, creates a shipment, captures payment, and marks the session succeeded (happy path)', async () => {
    paymentSessions.findByProviderSessionId.mockResolvedValue(buildSession());

    const result = await useCase.execute({ providerSessionId: 'pi_123', providerReference: 'ch_123' });

    expect(orders.create).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 'store-1',
        orderNumber: 'ORD-20260802-ABCD1234',
        paymentMethod: 'CARD',
        items: SNAPSHOT_ITEMS,
      }),
    );
    expect(confirmStockReservation.execute).toHaveBeenCalledWith({
      reservationId: 'res-1',
      actor: { actorId: null, actorType: ActorType.SYSTEM },
    });
    expect(shipments.create).toHaveBeenCalledWith({
      storeId: 'store-1',
      orderId: 'order-1',
      shippingMethodId: 'method-1',
    });
    expect(orders.changeStatus).toHaveBeenCalledWith(
      'order-1',
      ORDER_STATUS.CONFIRMED,
      'Payment captured via Stripe.',
      { actorId: null, actorType: ActorType.SYSTEM },
      { paymentStatus: PAYMENT_STATUS.PAID },
    );
    expect(paymentTransactions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: PAYMENT_PROVIDER.STRIPE,
        type: PAYMENT_TRANSACTION_TYPE.CAPTURE,
        providerReference: 'ch_123',
      }),
    );
    expect(paymentSessions.markSucceeded).toHaveBeenCalledWith('session-1', 'order-1');
    expect(result).toBeInstanceOf(Order);
  });

  it('confirms every reservation listed in the snapshot, not just the first', async () => {
    paymentSessions.findByProviderSessionId.mockResolvedValue(
      buildSession({}),
    );
    (paymentSessions.findByProviderSessionId as jest.Mock).mockResolvedValue(
      PaymentSession.reconstitute({
        ...buildSession().toProps(),
        pendingOrderSnapshot: buildSnapshot({ reservationIds: ['res-1', 'res-2'] }),
      }),
    );

    await useCase.execute({ providerSessionId: 'pi_123', providerReference: 'ch_123' });

    expect(confirmStockReservation.execute).toHaveBeenCalledTimes(2);
    expect(confirmStockReservation.execute).toHaveBeenNthCalledWith(1, {
      reservationId: 'res-1',
      actor: { actorId: null, actorType: ActorType.SYSTEM },
    });
    expect(confirmStockReservation.execute).toHaveBeenNthCalledWith(2, {
      reservationId: 'res-2',
      actor: { actorId: null, actorType: ActorType.SYSTEM },
    });
  });
});
