import { randomUUID } from 'node:crypto';
import { ActorType } from '@za/types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaOutboxRepository } from '../../../../infrastructure/events/prisma-outbox.repository';
import { PrismaShipmentRepository } from './prisma-shipment.repository';
import { SHIPMENT_STATUS } from '../../domain/constants/shipment-status.constants';
import { IllegalShipmentStatusTransitionError, ShipmentNotFoundError } from '../../domain/errors/shipping.errors';

describe('PrismaShipmentRepository (integration)', () => {
  const prisma = new PrismaService();
  const outbox = new PrismaOutboxRepository(prisma);
  const repository = new PrismaShipmentRepository(prisma, outbox);
  const systemActor = { actorId: null, actorType: ActorType.SYSTEM };
  let storeId: string;

  async function createOrder(): Promise<{ id: string; orderNumber: string }> {
    const orderNumber = `ORD-TEST-${randomUUID()}`;
    const order = await prisma.order.create({
      data: {
        storeId,
        orderNumber,
        customerNameSnapshot: 'Demo Customer',
        customerEmailSnapshot: 'demo@example.com',
        customerPhoneSnapshot: '+9647700000000',
        shippingFullName: 'Demo Customer',
        shippingPhone: '+9647700000000',
        shippingLine1: '123 Al-Rasheed Street',
        shippingCity: 'Baghdad',
        shippingGovernorate: 'Baghdad',
        shippingCountry: 'Iraq',
        subtotal: '39000',
        total: '44000',
        paymentMethod: 'COD',
      },
    });
    return { id: order.id, orderNumber };
  }

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Shipment Integration Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;
  });

  afterAll(async () => {
    await prisma.outboxEvent.deleteMany({ where: { storeId } });
    await prisma.shipmentTrackingEvent.deleteMany({ where: { shipment: { storeId } } });
    await prisma.shipment.deleteMany({ where: { storeId } });
    await prisma.order.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates a shipment at PENDING with an initial tracking event, one per order', async () => {
    const order = await createOrder();

    const shipment = await repository.create({ storeId, orderId: order.id, shippingMethodId: null });

    expect(shipment.status).toBe(SHIPMENT_STATUS.PENDING);
    expect(shipment.orderId).toBe(order.id);
    expect(shipment.trackingEvents).toHaveLength(1);
    expect(shipment.trackingEvents[0]!.status).toBe(SHIPMENT_STATUS.PENDING);
  });

  it('finds by id and by orderId, scoped to the store', async () => {
    const order = await createOrder();
    const shipment = await repository.create({ storeId, orderId: order.id, shippingMethodId: null });

    expect((await repository.findById(storeId, shipment.id))?.id).toBe(shipment.id);
    expect((await repository.findByOrderId(storeId, order.id))?.id).toBe(shipment.id);
    expect(await repository.findById('some-other-store', shipment.id)).toBeNull();
  });

  it('lists every shipment for the store', async () => {
    const order = await createOrder();
    const shipment = await repository.create({ storeId, orderId: order.id, shippingMethodId: null });

    const all = await repository.list(storeId);
    expect(all.map((s) => s.id)).toContain(shipment.id);
  });

  it('dispatch() moves PENDING -> IN_TRANSIT, persists tracking fields, appends a tracking event, and writes a ShipmentDispatched outbox event', async () => {
    const order = await createOrder();
    const shipment = await repository.create({ storeId, orderId: order.id, shippingMethodId: null });

    const dispatched = await repository.dispatch(
      shipment.id,
      { trackingNumber: 'TRK-1', carrierName: 'Aramex', trackingUrl: 'https://track.example.com/TRK-1', labelUrl: null },
      systemActor,
    );

    expect(dispatched.status).toBe(SHIPMENT_STATUS.IN_TRANSIT);
    expect(dispatched.trackingNumber).toBe('TRK-1');
    expect(dispatched.carrierName).toBe('Aramex');
    expect(dispatched.dispatchedAt).not.toBeNull();
    expect(dispatched.trackingEvents).toHaveLength(2);
    expect(dispatched.trackingEvents[1]!.status).toBe(SHIPMENT_STATUS.IN_TRANSIT);

    const event = await prisma.outboxEvent.findFirst({
      where: { aggregateId: shipment.id, eventType: 'ShipmentDispatched' },
    });
    expect(event).not.toBeNull();
    expect(event?.status).toBe('PENDING');
    const payload = event?.payload as { orderId: string; orderNumber: string; customerEmail: string; trackingNumber: string };
    expect(payload.orderId).toBe(order.id);
    expect(payload.orderNumber).toBe(order.orderNumber);
    expect(payload.customerEmail).toBe('demo@example.com');
    expect(payload.trackingNumber).toBe('TRK-1');
  });

  it('dispatch() throws IllegalShipmentStatusTransitionError for an already-dispatched (IN_TRANSIT) shipment', async () => {
    const order = await createOrder();
    const shipment = await repository.create({ storeId, orderId: order.id, shippingMethodId: null });
    await repository.dispatch(
      shipment.id,
      { trackingNumber: 'TRK-1', carrierName: null, trackingUrl: null, labelUrl: null },
      systemActor,
    );

    await expect(
      repository.dispatch(
        shipment.id,
        { trackingNumber: 'TRK-2', carrierName: null, trackingUrl: null, labelUrl: null },
        systemActor,
      ),
    ).rejects.toThrow(IllegalShipmentStatusTransitionError);
  });

  it('dispatch() throws ShipmentNotFoundError for an unknown shipment id', async () => {
    await expect(
      repository.dispatch('missing-shipment', { trackingNumber: 'TRK-1', carrierName: null, trackingUrl: null, labelUrl: null }, systemActor),
    ).rejects.toThrow(ShipmentNotFoundError);
  });

  it('markDelivered() moves IN_TRANSIT -> DELIVERED and writes a ShipmentDelivered outbox event', async () => {
    const order = await createOrder();
    const shipment = await repository.create({ storeId, orderId: order.id, shippingMethodId: null });
    await repository.dispatch(
      shipment.id,
      { trackingNumber: 'TRK-1', carrierName: null, trackingUrl: null, labelUrl: null },
      systemActor,
    );

    const delivered = await repository.markDelivered(shipment.id, systemActor);

    expect(delivered.status).toBe(SHIPMENT_STATUS.DELIVERED);
    expect(delivered.deliveredAt).not.toBeNull();
    expect(delivered.trackingEvents).toHaveLength(3);

    const event = await prisma.outboxEvent.findFirst({
      where: { aggregateId: shipment.id, eventType: 'ShipmentDelivered' },
    });
    expect(event).not.toBeNull();
    const payload = event?.payload as { orderId: string; orderNumber: string; customerEmail: string };
    expect(payload.orderId).toBe(order.id);
    expect(payload.customerEmail).toBe('demo@example.com');
  });

  it('markDelivered() throws IllegalShipmentStatusTransitionError for a shipment still PENDING (never dispatched)', async () => {
    const order = await createOrder();
    const shipment = await repository.create({ storeId, orderId: order.id, shippingMethodId: null });

    await expect(repository.markDelivered(shipment.id, systemActor)).rejects.toThrow(
      IllegalShipmentStatusTransitionError,
    );
  });

  it('markDelivered() throws ShipmentNotFoundError for an unknown shipment id', async () => {
    await expect(repository.markDelivered('missing-shipment', systemActor)).rejects.toThrow(ShipmentNotFoundError);
  });

  it('appendTrackingEvent() appends a standalone tracking event without changing status', async () => {
    const order = await createOrder();
    const shipment = await repository.create({ storeId, orderId: order.id, shippingMethodId: null });

    const updated = await repository.appendTrackingEvent(
      shipment.id,
      SHIPMENT_STATUS.PENDING,
      'Awaiting pickup at warehouse.',
      systemActor,
    );

    expect(updated.status).toBe(SHIPMENT_STATUS.PENDING);
    expect(updated.trackingEvents).toHaveLength(2);
    expect(updated.trackingEvents[1]!.note).toBe('Awaiting pickup at warehouse.');
  });

  it('appendTrackingEvent() throws ShipmentNotFoundError for an unknown shipment id', async () => {
    await expect(
      repository.appendTrackingEvent('missing-shipment', SHIPMENT_STATUS.PENDING, null, systemActor),
    ).rejects.toThrow(ShipmentNotFoundError);
  });
});
