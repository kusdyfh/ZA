import { ActorType } from '@za/types';
import { CancelOrderUseCase } from './cancel-order.use-case';
import type { OrderRepository } from '../../domain/repositories/order.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Order } from '../../domain/entities/order.entity';
import { ORDER_STATUS } from '../../domain/constants/order-status.constants';
import { PAYMENT_METHOD } from '../../domain/constants/payment-method.constants';
import { PAYMENT_STATUS } from '../../domain/constants/payment-status.constants';
import { CancelReasonRequiredError, IllegalOrderStatusTransitionError, OrderNotFoundError } from '../../domain/errors/order.errors';
import type { GetStockReservationUseCase } from '../../../inventory/application/use-cases/get-stock-reservation.use-case';
import type { ReleaseStockReservationUseCase } from '../../../inventory/application/use-cases/release-stock-reservation.use-case';
import type { ProcessReturnUseCase } from '../../../inventory/application/use-cases/process-return.use-case';
import { StockReservation } from '../../../inventory/domain/entities/stock-reservation.entity';
import { STOCK_RESERVATION_STATUS } from '../../../inventory/domain/constants/stock-reservation-status.constants';
import { RETURN_DISPOSITION } from '../../../inventory/domain/constants/return-disposition.constants';

function buildOrder(status: string, itemOverrides: Partial<{ variantId: string | null; stockReservationId: string; quantity: number }> = {}): Order {
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
    items: [
      {
        id: 'item-1',
        variantId: 'variant-1',
        stockReservationId: 'res-1',
        productNameSnapshot: 'Classic V-Neck Scrub Top',
        skuSnapshot: 'ZA-TOP-VNECK-001-NVY-M',
        unitPrice: 39000,
        quantity: 2,
        lineTotal: 78000,
        ...itemOverrides,
      },
    ],
    statusHistory: [],
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildReservation(status: string): StockReservation {
  return StockReservation.reconstitute({
    id: 'res-1',
    variantId: 'variant-1',
    warehouseId: 'wh-1',
    cartId: 'cart-1',
    quantity: 2,
    status: status as never,
    expiresAt: new Date(Date.now() + 10 * 60_000),
    createdAt: new Date(),
    confirmedAt: status === STOCK_RESERVATION_STATUS.CONFIRMED ? new Date() : null,
    releasedAt: null,
  });
}

describe('CancelOrderUseCase', () => {
  let orders: jest.Mocked<OrderRepository>;
  let storeContext: StoreContext;
  let getStockReservation: jest.Mocked<GetStockReservationUseCase>;
  let releaseStockReservation: jest.Mocked<ReleaseStockReservationUseCase>;
  let processReturn: jest.Mocked<ProcessReturnUseCase>;
  let useCase: CancelOrderUseCase;
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
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    getStockReservation = { execute: jest.fn() } as unknown as jest.Mocked<GetStockReservationUseCase>;
    releaseStockReservation = { execute: jest.fn() } as unknown as jest.Mocked<ReleaseStockReservationUseCase>;
    processReturn = { execute: jest.fn() } as unknown as jest.Mocked<ProcessReturnUseCase>;
    useCase = new CancelOrderUseCase(
      orders,
      storeContext,
      getStockReservation,
      releaseStockReservation,
      processReturn,
    );
  });

  it('releases an ACTIVE reservation when cancelling a still-Pending order', async () => {
    orders.findById.mockResolvedValue(buildOrder(ORDER_STATUS.PENDING));
    getStockReservation.execute.mockResolvedValue(buildReservation(STOCK_RESERVATION_STATUS.ACTIVE));
    orders.changeStatus.mockResolvedValue(buildOrder(ORDER_STATUS.CANCELLED));

    await useCase.execute({ orderId: 'order-1', reason: 'Customer changed mind', actor });

    expect(releaseStockReservation.execute).toHaveBeenCalledWith({ reservationId: 'res-1' });
    expect(processReturn.execute).not.toHaveBeenCalled();
    expect(orders.changeStatus).toHaveBeenCalledWith(
      'order-1',
      ORDER_STATUS.CANCELLED,
      'Cancelled: Customer changed mind',
      actor,
      { cancelReason: 'Customer changed mind' },
    );
  });

  it('restocks via a RESELLABLE return when cancelling a stock-committed (Confirmed) order', async () => {
    orders.findById.mockResolvedValue(buildOrder(ORDER_STATUS.CONFIRMED));
    getStockReservation.execute.mockResolvedValue(buildReservation(STOCK_RESERVATION_STATUS.CONFIRMED));
    orders.changeStatus.mockResolvedValue(buildOrder(ORDER_STATUS.CANCELLED));

    await useCase.execute({ orderId: 'order-1', reason: 'Fraud suspected', actor });

    expect(processReturn.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        variantId: 'variant-1',
        warehouseId: 'wh-1',
        quantity: 2,
        disposition: RETURN_DISPOSITION.RESELLABLE,
      }),
    );
    expect(releaseStockReservation.execute).not.toHaveBeenCalled();
  });

  it('falls back to the reservation-owned variantId when the OrderItem variantId is null', async () => {
    orders.findById.mockResolvedValue(buildOrder(ORDER_STATUS.CONFIRMED, { variantId: null }));
    getStockReservation.execute.mockResolvedValue(buildReservation(STOCK_RESERVATION_STATUS.CONFIRMED));
    orders.changeStatus.mockResolvedValue(buildOrder(ORDER_STATUS.CANCELLED));

    await useCase.execute({ orderId: 'order-1', reason: 'Variant deleted', actor });

    expect(processReturn.execute).toHaveBeenCalledWith(
      expect.objectContaining({ variantId: 'variant-1' }),
    );
  });

  it('does nothing to stock for an already RELEASED reservation (idempotent)', async () => {
    orders.findById.mockResolvedValue(buildOrder(ORDER_STATUS.PENDING));
    getStockReservation.execute.mockResolvedValue(buildReservation(STOCK_RESERVATION_STATUS.RELEASED));
    orders.changeStatus.mockResolvedValue(buildOrder(ORDER_STATUS.CANCELLED));

    await useCase.execute({ orderId: 'order-1', reason: 'Duplicate cancel', actor });

    expect(releaseStockReservation.execute).not.toHaveBeenCalled();
    expect(processReturn.execute).not.toHaveBeenCalled();
  });

  it('rejects a missing cancel reason before touching the repository', async () => {
    await expect(
      useCase.execute({ orderId: 'order-1', reason: '', actor }),
    ).rejects.toThrow(CancelReasonRequiredError);
    expect(orders.findById).not.toHaveBeenCalled();
  });

  it('throws OrderNotFoundError for an unknown order', async () => {
    orders.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ orderId: 'missing', reason: 'Some reason', actor }),
    ).rejects.toThrow(OrderNotFoundError);
  });

  it('rejects cancelling an order already Shipped', async () => {
    orders.findById.mockResolvedValue(buildOrder(ORDER_STATUS.SHIPPED));

    await expect(
      useCase.execute({ orderId: 'order-1', reason: 'Too late', actor }),
    ).rejects.toThrow(IllegalOrderStatusTransitionError);
    expect(getStockReservation.execute).not.toHaveBeenCalled();
  });
});
