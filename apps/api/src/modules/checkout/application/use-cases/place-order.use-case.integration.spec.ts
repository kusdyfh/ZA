import { randomUUID } from 'node:crypto';
import { ActorType } from '@za/types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaCartRepository } from '../../infrastructure/repositories/prisma-cart.repository';
import { PrismaProductVariantRepository } from '../../../catalog/infrastructure/repositories/prisma-product-variant.repository';
import { PrismaProductRepository } from '../../../catalog/infrastructure/repositories/prisma-product.repository';
import { PrismaWarehouseRepository } from '../../../inventory/infrastructure/repositories/prisma-warehouse.repository';
import { PrismaVariantStockRepository } from '../../../inventory/infrastructure/repositories/prisma-variant-stock.repository';
import { PrismaStockReservationRepository } from '../../../inventory/infrastructure/repositories/prisma-stock-reservation.repository';
import { CreateStockReservationUseCase } from '../../../inventory/application/use-cases/create-stock-reservation.use-case';
import { ConfirmStockReservationUseCase } from '../../../inventory/application/use-cases/confirm-stock-reservation.use-case';
import { ReleaseStockReservationUseCase } from '../../../inventory/application/use-cases/release-stock-reservation.use-case';
import { GetStockReservationUseCase } from '../../../inventory/application/use-cases/get-stock-reservation.use-case';
import { ProcessReturnUseCase } from '../../../inventory/application/use-cases/process-return.use-case';
import { STOCK_MOVEMENT_TYPE } from '../../../inventory/domain/constants/stock-movement-type.constants';
import { PrismaOrderRepository } from '../../../orders/infrastructure/repositories/prisma-order.repository';
import { PrismaOutboxRepository } from '../../../../infrastructure/events/prisma-outbox.repository';
import { CancelOrderUseCase } from '../../../orders/application/use-cases/cancel-order.use-case';
import { PrismaShippingZoneRepository } from '../../../shipping/infrastructure/repositories/prisma-shipping-zone.repository';
import { PrismaShippingMethodRepository } from '../../../shipping/infrastructure/repositories/prisma-shipping-method.repository';
import { PrismaShippingRateRepository } from '../../../shipping/infrastructure/repositories/prisma-shipping-rate.repository';
import { PrismaShipmentRepository } from '../../../shipping/infrastructure/repositories/prisma-shipment.repository';
import { QuoteShippingRateUseCase } from '../../../shipping/application/use-cases/quote-shipping-rate.use-case';
import { ORDER_STATUS } from '../../../orders/domain/constants/order-status.constants';
import { PAYMENT_METHOD } from '../../../orders/domain/constants/payment-method.constants';
import { PAYMENT_STATUS } from '../../../orders/domain/constants/payment-status.constants';
import { PlaceOrderUseCase, type PlaceOrderInput } from './place-order.use-case';
import { ItemUnavailableAtCheckoutError } from '../../domain/errors/checkout.errors';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';

describe('PlaceOrderUseCase + CancelOrderUseCase (integration)', () => {
  const prisma = new PrismaService();
  let storeId: string;
  let variantId: string;
  let warehouseId: string;
  let shippingMethodId: string;
  let storeContext: StoreContext;

  let carts: PrismaCartRepository;
  let placeOrder: PlaceOrderUseCase;
  let cancelOrder: CancelOrderUseCase;
  let variantStocks: PrismaVariantStockRepository;

  const validCheckoutInput = (guestToken: string): PlaceOrderInput => ({
    guestToken,
    customerName: 'Demo Customer',
    customerEmail: 'demo@example.com',
    customerPhone: '+9647700000000',
    shippingFullName: 'Demo Customer',
    shippingPhone: '+9647700000000',
    shippingLine1: '123 Al-Rasheed Street',
    shippingCity: 'Baghdad',
    shippingGovernorate: 'Baghdad',
    shippingCountry: 'Iraq',
    shippingMethodId,
    paymentMethod: PAYMENT_METHOD.COD,
  });

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Place Order Integration Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;
    storeContext = { getCurrentStoreId: () => Promise.resolve(storeId) } as unknown as StoreContext;

    const category = await prisma.category.create({
      data: { storeId, name: 'Scrubs', slug: `scrubs-${randomUUID()}` },
    });
    const product = await prisma.product.create({
      data: {
        storeId,
        name: 'Classic V-Neck Scrub Top',
        slug: `test-product-${randomUUID()}`,
        sku: `TEST-SKU-${randomUUID()}`,
        price: '39000',
        currencyCode: 'IQD',
        categoryId: category.id,
      },
    });
    const variant = await prisma.productVariant.create({
      data: { storeId, productId: product.id, sku: `TEST-VARIANT-${randomUUID()}` },
    });
    variantId = variant.id;

    const warehouse = await prisma.warehouse.create({
      data: { storeId, name: 'Main Warehouse', code: `MAIN-${randomUUID()}`, isDefault: true },
    });
    warehouseId = warehouse.id;

    const shippingMethod = await prisma.shippingMethod.create({
      data: { storeId, name: `Standard-${randomUUID()}`, minDays: 3, maxDays: 5 },
    });
    shippingMethodId = shippingMethod.id;
    const shippingZone = await prisma.shippingZone.create({
      data: { storeId, name: `Central-${randomUUID()}`, governorates: ['Baghdad'] },
    });
    await prisma.shippingRate.create({
      data: { storeId, zoneId: shippingZone.id, methodId: shippingMethodId, fee: '5000' },
    });

    const productVariants = new PrismaProductVariantRepository(prisma);
    const products = new PrismaProductRepository(prisma);
    const warehouses = new PrismaWarehouseRepository(prisma);
    variantStocks = new PrismaVariantStockRepository(prisma);
    const reservations = new PrismaStockReservationRepository(prisma);
    const outbox = new PrismaOutboxRepository(prisma);
    const orders = new PrismaOrderRepository(prisma, outbox);
    carts = new PrismaCartRepository(prisma);
    const shipments = new PrismaShipmentRepository(prisma, outbox);
    const shippingZones = new PrismaShippingZoneRepository(prisma);
    const shippingMethods = new PrismaShippingMethodRepository(prisma);
    const shippingRates = new PrismaShippingRateRepository(prisma);
    const quoteShippingRate = new QuoteShippingRateUseCase(shippingZones, shippingRates, shippingMethods, storeContext);

    const createStockReservation = new CreateStockReservationUseCase(
      reservations,
      warehouses,
      productVariants,
      storeContext,
    );
    const confirmStockReservation = new ConfirmStockReservationUseCase(reservations);
    const releaseStockReservation = new ReleaseStockReservationUseCase(reservations);
    const getStockReservation = new GetStockReservationUseCase(reservations);
    const processReturn = new ProcessReturnUseCase(variantStocks, warehouses, productVariants, storeContext);

    placeOrder = new PlaceOrderUseCase(
      carts,
      productVariants,
      products,
      orders,
      shipments,
      createStockReservation,
      confirmStockReservation,
      releaseStockReservation,
      quoteShippingRate,
      storeContext,
    );
    cancelOrder = new CancelOrderUseCase(orders, storeContext, getStockReservation, releaseStockReservation, processReturn);
  });

  afterAll(async () => {
    await prisma.orderNote.deleteMany({ where: { order: { storeId } } });
    await prisma.orderStatusHistory.deleteMany({ where: { order: { storeId } } });
    await prisma.orderItem.deleteMany({ where: { order: { storeId } } });
    await prisma.order.deleteMany({ where: { storeId } });
    await prisma.stockReservation.deleteMany({ where: { variantId } });
    await prisma.stockMovement.deleteMany({ where: { variantId } });
    await prisma.variantStock.deleteMany({ where: { variantId } });
    await prisma.cartItem.deleteMany({ where: { cart: { storeId } } });
    await prisma.cart.deleteMany({ where: { storeId } });
    await prisma.warehouse.deleteMany({ where: { storeId } });
    await prisma.productVariant.deleteMany({ where: { storeId } });
    await prisma.product.deleteMany({ where: { storeId } });
    await prisma.category.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  async function receiveStock(quantity: number): Promise<void> {
    await variantStocks.applyMovement({
      variantId,
      warehouseId,
      type: STOCK_MOVEMENT_TYPE.RECEIVE,
      quantity,
      actor: { actorId: null, actorType: ActorType.SYSTEM },
    });
  }

  async function currentStock(): Promise<number> {
    const stock = await variantStocks.findByVariantAndWarehouse(variantId, warehouseId);
    return stock?.quantity ?? 0;
  }

  it('places a full order end-to-end: reserves stock, snapshots pricing, auto-confirms COD, decrements real stock, clears the cart', async () => {
    await receiveStock(10);
    const guestToken = `guest-${randomUUID()}`;
    const cart = await carts.findOrCreateByToken(storeId, guestToken);
    await carts.addItem(cart.id, variantId, 2);

    const order = await placeOrder.execute(validCheckoutInput(guestToken));

    expect(order.status).toBe(ORDER_STATUS.CONFIRMED);
    expect(order.paymentStatus).toBe(PAYMENT_STATUS.AWAITING_COLLECTION);
    expect(order.items).toHaveLength(1);
    expect(order.items[0]!.quantity).toBe(2);
    expect(order.items[0]!.productNameSnapshot).toBe('Classic V-Neck Scrub Top');
    expect(order.subtotal).toBe(order.items[0]!.lineTotal);

    expect(await currentStock()).toBe(8);

    const clearedCart = await carts.findByToken(storeId, guestToken);
    expect(clearedCart?.items).toEqual([]);
  });

  it('cancelling a CONFIRMED (stock-committed) order restocks via a RESELLABLE return', async () => {
    const stockBefore = await currentStock();
    const guestToken = `guest-${randomUUID()}`;
    const cart = await carts.findOrCreateByToken(storeId, guestToken);
    await carts.addItem(cart.id, variantId, 1);

    const order = await placeOrder.execute(validCheckoutInput(guestToken));
    expect(order.status).toBe(ORDER_STATUS.CONFIRMED);
    expect(await currentStock()).toBe(stockBefore - 1);

    const cancelled = await cancelOrder.execute({
      orderId: order.id,
      reason: 'Customer changed mind',
      actor: { actorId: null, actorType: ActorType.SYSTEM },
    });

    expect(cancelled.status).toBe(ORDER_STATUS.CANCELLED);
    expect(cancelled.cancelReason).toBe('Customer changed mind');
    expect(await currentStock()).toBe(stockBefore);
  });

  it('proves no overselling: two simultaneous checkouts for the last unit — exactly one succeeds', async () => {
    await prisma.variantStock.updateMany({ where: { variantId, warehouseId }, data: { quantity: 1 } });
    expect(await currentStock()).toBe(1);

    const guestTokenA = `guest-race-a-${randomUUID()}`;
    const guestTokenB = `guest-race-b-${randomUUID()}`;
    const cartA = await carts.findOrCreateByToken(storeId, guestTokenA);
    const cartB = await carts.findOrCreateByToken(storeId, guestTokenB);
    await carts.addItem(cartA.id, variantId, 1);
    await carts.addItem(cartB.id, variantId, 1);

    const results = await Promise.allSettled([
      placeOrder.execute(validCheckoutInput(guestTokenA)),
      placeOrder.execute(validCheckoutInput(guestTokenB)),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ItemUnavailableAtCheckoutError);
    expect(await currentStock()).toBe(0);
  });
});
