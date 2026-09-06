import { randomUUID } from 'node:crypto';
import { ActorType } from '@za/types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaOutboxRepository } from '../../../../infrastructure/events/prisma-outbox.repository';
import { PrismaOrderRepository } from './prisma-order.repository';
import { ORDER_STATUS } from '../../domain/constants/order-status.constants';
import { PAYMENT_METHOD } from '../../domain/constants/payment-method.constants';
import { PAYMENT_STATUS } from '../../domain/constants/payment-status.constants';
import { IllegalOrderStatusTransitionError, OrderNotFoundError } from '../../domain/errors/order.errors';
import type { CreateOrderData } from '../../domain/repositories/order.repository';

describe('PrismaOrderRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaOrderRepository(prisma, new PrismaOutboxRepository(prisma));
  const systemActor = { actorId: null, actorType: ActorType.SYSTEM };
  const adminActor = { actorId: 'admin-1', actorType: ActorType.ADMIN };
  let storeId: string;
  let variantId: string;
  let warehouseId: string;

  async function createReservation(): Promise<string> {
    const reservation = await prisma.stockReservation.create({
      data: {
        variantId,
        warehouseId,
        cartId: `cart-${randomUUID()}`,
        quantity: 1,
        status: 'CONFIRMED',
        expiresAt: new Date(Date.now() + 10 * 60_000),
        confirmedAt: new Date(),
      },
    });
    return reservation.id;
  }

  async function createOrderData(): Promise<CreateOrderData> {
    return {
      storeId,
      orderNumber: `ORD-TEST-${randomUUID()}`,
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
      subtotal: 39000,
      discountTotal: 0,
      shippingFee: 5000,
      taxTotal: 0,
      total: 44000,
      currencyCode: 'IQD',
      paymentMethod: PAYMENT_METHOD.COD,
      items: [
        {
          variantId,
          stockReservationId: await createReservation(),
          productNameSnapshot: 'Classic V-Neck Scrub Top',
          skuSnapshot: 'ZA-TOP-VNECK-001-NVY-M',
          unitPrice: 39000,
          quantity: 1,
          lineTotal: 39000,
        },
      ],
    };
  }

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Order Integration Store', domain: `test-${randomUUID()}.local` },
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
    const variant = await prisma.productVariant.create({
      data: { storeId, productId: product.id, sku: `TEST-VARIANT-${randomUUID()}` },
    });
    variantId = variant.id;

    const warehouse = await prisma.warehouse.create({
      data: { storeId, name: 'Main Warehouse', code: `MAIN-${randomUUID()}`, isDefault: true },
    });
    warehouseId = warehouse.id;
  });

  afterAll(async () => {
    await prisma.outboxEvent.deleteMany({ where: { storeId } });
    await prisma.orderNote.deleteMany({ where: { order: { storeId } } });
    await prisma.orderStatusHistory.deleteMany({ where: { order: { storeId } } });
    await prisma.orderItem.deleteMany({ where: { order: { storeId } } });
    await prisma.order.deleteMany({ where: { storeId } });
    await prisma.stockReservation.deleteMany({ where: { variantId } });
    await prisma.warehouse.deleteMany({ where: { storeId } });
    await prisma.productVariant.deleteMany({ where: { storeId } });
    await prisma.product.deleteMany({ where: { storeId } });
    await prisma.category.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates an order with its items and initial PENDING history row in one transaction', async () => {
    const data = await createOrderData();
    const order = await repository.create(data);

    expect(order.status).toBe(ORDER_STATUS.PENDING);
    expect(order.items).toHaveLength(1);
    expect(order.items[0]!.productNameSnapshot).toBe('Classic V-Neck Scrub Top');
    expect(order.statusHistory).toHaveLength(1);
    expect(order.statusHistory[0]!.status).toBe(ORDER_STATUS.PENDING);
  });

  it('writes an OrderPlaced OutboxEvent in the same transaction as the order (ADR 0002/0023)', async () => {
    const data = await createOrderData();
    const created = await repository.create(data);

    const event = await prisma.outboxEvent.findFirst({
      where: { aggregateId: created.id, eventType: 'OrderPlaced' },
    });
    expect(event).not.toBeNull();
    expect(event?.status).toBe('PENDING');
    expect((event?.payload as { orderNumber: string }).orderNumber).toBe(data.orderNumber);
  });

  it('writes an OrderStatusChanged OutboxEvent when changeStatus() transitions the order', async () => {
    const data = await createOrderData();
    const created = await repository.create(data);

    await repository.changeStatus(created.id, ORDER_STATUS.CONFIRMED, 'Payment confirmed.', systemActor, {
      paymentStatus: PAYMENT_STATUS.PAID,
    });

    const event = await prisma.outboxEvent.findFirst({
      where: { aggregateId: created.id, eventType: 'OrderStatusChanged' },
    });
    expect(event).not.toBeNull();
    expect((event?.payload as { fromStatus: string; toStatus: string }).fromStatus).toBe(ORDER_STATUS.PENDING);
    expect((event?.payload as { fromStatus: string; toStatus: string }).toStatus).toBe(ORDER_STATUS.CONFIRMED);
  });

  it('finds an order by id and by orderNumber, scoped to the store', async () => {
    const data = await createOrderData();
    const created = await repository.create(data);

    expect((await repository.findById(storeId, created.id))?.id).toBe(created.id);
    expect((await repository.findByOrderNumber(storeId, data.orderNumber))?.id).toBe(created.id);
    expect(await repository.findById('some-other-store', created.id)).toBeNull();
  });

  it('lists orders for the store, optionally filtered by status', async () => {
    const data = await createOrderData();
    await repository.create(data);

    const all = await repository.list(storeId);
    expect(all.length).toBeGreaterThan(0);

    const pendingOnly = await repository.list(storeId, { status: ORDER_STATUS.PENDING });
    expect(pendingOnly.every((o) => o.status === ORDER_STATUS.PENDING)).toBe(true);
  });

  it('changeStatus validates the transition and appends a timeline row', async () => {
    const data = await createOrderData();
    const created = await repository.create(data);

    const confirmed = await repository.changeStatus(
      created.id,
      ORDER_STATUS.CONFIRMED,
      'Payment confirmed (Cash on Delivery).',
      systemActor,
      { paymentStatus: PAYMENT_STATUS.PAID },
    );

    expect(confirmed.status).toBe(ORDER_STATUS.CONFIRMED);
    expect(confirmed.paymentStatus).toBe(PAYMENT_STATUS.PAID);
    expect(confirmed.statusHistory).toHaveLength(2);
    expect(confirmed.statusHistory[1]!.status).toBe(ORDER_STATUS.CONFIRMED);
  });

  it('rejects an illegal transition (e.g. Pending straight to Shipped)', async () => {
    const data = await createOrderData();
    const created = await repository.create(data);

    await expect(
      repository.changeStatus(created.id, ORDER_STATUS.SHIPPED, null, systemActor),
    ).rejects.toThrow(IllegalOrderStatusTransitionError);
  });

  it('throws OrderNotFoundError when changing status of an unknown order', async () => {
    await expect(
      repository.changeStatus('missing-order', ORDER_STATUS.CONFIRMED, null, systemActor),
    ).rejects.toThrow(OrderNotFoundError);
  });

  it('adds a note and returns the reloaded aggregate', async () => {
    const data = await createOrderData();
    const created = await repository.create(data);

    const withNote = await repository.addNote(created.id, 'Called customer to confirm address.', true, adminActor);

    expect(withNote.notes).toHaveLength(1);
    expect(withNote.notes[0]!.body).toBe('Called customer to confirm address.');
    expect(withNote.notes[0]!.isInternal).toBe(true);
  });

  it('throws OrderNotFoundError when adding a note to an unknown order', async () => {
    await expect(
      repository.addNote('missing-order', 'Note.', true, adminActor),
    ).rejects.toThrow(OrderNotFoundError);
  });
});
