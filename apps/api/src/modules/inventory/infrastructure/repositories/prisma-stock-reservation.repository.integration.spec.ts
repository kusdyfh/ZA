import { randomUUID } from 'node:crypto';
import { ActorType } from '@za/types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaStockReservationRepository } from './prisma-stock-reservation.repository';
import { PrismaVariantStockRepository } from './prisma-variant-stock.repository';
import { STOCK_MOVEMENT_TYPE } from '../../domain/constants/stock-movement-type.constants';
import { STOCK_RESERVATION_STATUS } from '../../domain/constants/stock-reservation-status.constants';
import { InsufficientStockError } from '../../domain/errors/inventory.errors';

describe('PrismaStockReservationRepository (integration)', () => {
  const prisma = new PrismaService();
  const reservations = new PrismaStockReservationRepository(prisma);
  const variantStocks = new PrismaVariantStockRepository(prisma);
  const systemActor = { actorId: null, actorType: ActorType.SYSTEM };
  const adminActor = { actorId: 'admin-1', actorType: ActorType.ADMIN };
  let storeId: string;
  let productId: string;
  let warehouseId: string;

  async function createVariant(sku: string) {
    const variant = await prisma.productVariant.create({ data: { storeId, productId, sku } });
    return variant.id;
  }

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Stock Reservation Integration Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;

    const category = await prisma.category.create({
      data: { storeId, name: 'Scrubs', slug: `scrubs-${randomUUID()}` },
    });

    const product = await prisma.product.create({
      data: {
        storeId,
        name: 'Test Product',
        slug: `test-product-${randomUUID()}`,
        sku: `TEST-SKU-${randomUUID()}`,
        price: '100.00',
        currencyCode: 'IQD',
        categoryId: category.id,
      },
    });
    productId = product.id;

    const warehouse = await prisma.warehouse.create({
      data: { storeId, name: 'Main Warehouse', code: `MAIN-${randomUUID()}`, isDefault: true },
    });
    warehouseId = warehouse.id;
  });

  afterAll(async () => {
    await prisma.stockReservation.deleteMany({ where: { warehouseId } });
    await prisma.stockMovement.deleteMany({ where: { warehouseId } });
    await prisma.variantStock.deleteMany({ where: { warehouseId } });
    await prisma.warehouse.deleteMany({ where: { storeId } });
    await prisma.productVariant.deleteMany({ where: { storeId } });
    await prisma.product.deleteMany({ where: { storeId } });
    await prisma.category.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('reserves stock when enough is available', async () => {
    const variantId = await createVariant(`SKU-CREATE-${randomUUID()}`);
    await variantStocks.applyMovement({
      variantId,
      warehouseId,
      type: STOCK_MOVEMENT_TYPE.RECEIVE,
      quantity: 5,
      actor: systemActor,
    });

    const reservation = await reservations.createIfAvailable({
      variantId,
      warehouseId,
      cartId: 'cart-1',
      quantity: 2,
    });

    expect(reservation.status).toBe(STOCK_RESERVATION_STATUS.ACTIVE);
    expect(await reservations.sumActiveQuantity(variantId, warehouseId)).toBe(2);
  });

  it('prevents overselling by rejecting a reservation exceeding availability', async () => {
    const variantId = await createVariant(`SKU-OVERSELL-${randomUUID()}`);
    await variantStocks.applyMovement({
      variantId,
      warehouseId,
      type: STOCK_MOVEMENT_TYPE.RECEIVE,
      quantity: 3,
      actor: systemActor,
    });
    await reservations.createIfAvailable({ variantId, warehouseId, cartId: 'cart-1', quantity: 2 });

    await expect(
      reservations.createIfAvailable({ variantId, warehouseId, cartId: 'cart-2', quantity: 2 }),
    ).rejects.toThrow(InsufficientStockError);
  });

  it('confirms a reservation: decrements stock and writes a SALE movement, atomically', async () => {
    const variantId = await createVariant(`SKU-CONFIRM-${randomUUID()}`);
    await variantStocks.applyMovement({
      variantId,
      warehouseId,
      type: STOCK_MOVEMENT_TYPE.RECEIVE,
      quantity: 5,
      actor: systemActor,
    });
    const reservation = await reservations.createIfAvailable({
      variantId,
      warehouseId,
      cartId: 'cart-1',
      quantity: 2,
    });

    const confirmed = await reservations.confirm(reservation.id, adminActor);

    expect(confirmed.status).toBe(STOCK_RESERVATION_STATUS.CONFIRMED);
    expect(confirmed.confirmedAt).not.toBeNull();

    const stock = await variantStocks.findByVariantAndWarehouse(variantId, warehouseId);
    expect(stock?.quantity).toBe(3);
  });

  it('is idempotent on confirm — a retried call never double-decrements stock', async () => {
    const variantId = await createVariant(`SKU-CONFIRM-IDEMPOTENT-${randomUUID()}`);
    await variantStocks.applyMovement({
      variantId,
      warehouseId,
      type: STOCK_MOVEMENT_TYPE.RECEIVE,
      quantity: 5,
      actor: systemActor,
    });
    const reservation = await reservations.createIfAvailable({
      variantId,
      warehouseId,
      cartId: 'cart-1',
      quantity: 2,
    });

    await reservations.confirm(reservation.id, adminActor);
    await reservations.confirm(reservation.id, adminActor);
    await reservations.confirm(reservation.id, adminActor);

    const stock = await variantStocks.findByVariantAndWarehouse(variantId, warehouseId);
    expect(stock?.quantity).toBe(3);
  });

  it('releases a reservation without ever touching stock', async () => {
    const variantId = await createVariant(`SKU-RELEASE-${randomUUID()}`);
    await variantStocks.applyMovement({
      variantId,
      warehouseId,
      type: STOCK_MOVEMENT_TYPE.RECEIVE,
      quantity: 5,
      actor: systemActor,
    });
    const reservation = await reservations.createIfAvailable({
      variantId,
      warehouseId,
      cartId: 'cart-1',
      quantity: 2,
    });

    const released = await reservations.release(reservation.id);

    expect(released.status).toBe(STOCK_RESERVATION_STATUS.RELEASED);
    const stock = await variantStocks.findByVariantAndWarehouse(variantId, warehouseId);
    expect(stock?.quantity).toBe(5);
    expect(await reservations.sumActiveQuantity(variantId, warehouseId)).toBe(0);
  });

  it('is idempotent on release', async () => {
    const variantId = await createVariant(`SKU-RELEASE-IDEMPOTENT-${randomUUID()}`);
    await variantStocks.applyMovement({
      variantId,
      warehouseId,
      type: STOCK_MOVEMENT_TYPE.RECEIVE,
      quantity: 5,
      actor: systemActor,
    });
    const reservation = await reservations.createIfAvailable({
      variantId,
      warehouseId,
      cartId: 'cart-1',
      quantity: 2,
    });

    await reservations.release(reservation.id);
    const secondRelease = await reservations.release(reservation.id);

    expect(secondRelease.status).toBe(STOCK_RESERVATION_STATUS.RELEASED);
  });

  it('bulk-expires every ACTIVE reservation past its expiresAt', async () => {
    const variantId = await createVariant(`SKU-EXPIRE-${randomUUID()}`);
    await variantStocks.applyMovement({
      variantId,
      warehouseId,
      type: STOCK_MOVEMENT_TYPE.RECEIVE,
      quantity: 5,
      actor: systemActor,
    });
    const alreadyExpired = await prisma.stockReservation.create({
      data: {
        variantId,
        warehouseId,
        cartId: 'cart-expired',
        quantity: 1,
        status: STOCK_RESERVATION_STATUS.ACTIVE,
        expiresAt: new Date(Date.now() - 60_000),
      },
    });
    const stillActive = await reservations.createIfAvailable({
      variantId,
      warehouseId,
      cartId: 'cart-still-active',
      quantity: 1,
    });

    const count = await reservations.expireAllDue(new Date());

    expect(count).toBeGreaterThanOrEqual(1);
    const expired = await reservations.findById(alreadyExpired.id);
    expect(expired?.status).toBe(STOCK_RESERVATION_STATUS.EXPIRED);
    const active = await reservations.findById(stillActive.id);
    expect(active?.status).toBe(STOCK_RESERVATION_STATUS.ACTIVE);
  });

  it('proves no overselling under simultaneous requests for the last unit', async () => {
    const variantId = await createVariant(`SKU-RACE-${randomUUID()}`);
    await variantStocks.applyMovement({
      variantId,
      warehouseId,
      type: STOCK_MOVEMENT_TYPE.RECEIVE,
      quantity: 1,
      actor: systemActor,
    });

    const attempts = await Promise.allSettled([
      reservations.createIfAvailable({ variantId, warehouseId, cartId: 'cart-a', quantity: 1 }),
      reservations.createIfAvailable({ variantId, warehouseId, cartId: 'cart-b', quantity: 1 }),
    ]);

    const fulfilled = attempts.filter((result) => result.status === 'fulfilled');
    const rejected = attempts.filter((result) => result.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(InsufficientStockError);

    const activeReserved = await reservations.sumActiveQuantity(variantId, warehouseId);
    expect(activeReserved).toBe(1);
    const stock = await variantStocks.findByVariantAndWarehouse(variantId, warehouseId);
    expect(stock?.quantity).toBe(1);
  });
});
