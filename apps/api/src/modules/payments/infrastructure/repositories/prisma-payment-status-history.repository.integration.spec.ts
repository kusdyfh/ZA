import { randomUUID } from 'node:crypto';
import { ActorType } from '@za/types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaPaymentStatusHistoryRepository } from './prisma-payment-status-history.repository';
import { PAYMENT_STATUS } from '../../../orders/domain/constants/payment-status.constants';

describe('PrismaPaymentStatusHistoryRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaPaymentStatusHistoryRepository(prisma);
  const systemActor = { actorId: null, actorType: ActorType.SYSTEM };
  let storeId: string;
  let orderId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Payment Status History Integration Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;

    const order = await prisma.order.create({
      data: {
        storeId,
        orderNumber: `ORD-TEST-${randomUUID()}`,
        customerNameSnapshot: 'Demo Customer',
        customerEmailSnapshot: 'demo@example.com',
        customerPhoneSnapshot: '+9647700000000',
        shippingFullName: 'Demo Customer',
        shippingPhone: '+9647700000000',
        shippingLine1: '123 Al-Rasheed Street',
        shippingCity: 'Baghdad',
        shippingGovernorate: 'Baghdad',
        shippingCountry: 'Iraq',
        subtotal: '83000',
        total: '83000',
        paymentMethod: 'COD',
      },
    });
    orderId = order.id;
  });

  afterAll(async () => {
    await prisma.paymentStatusHistory.deleteMany({ where: { storeId } });
    await prisma.order.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('appends a status history entry, resolving storeId from the order', async () => {
    const entry = await repository.append(orderId, PAYMENT_STATUS.AWAITING_COLLECTION, 'COD order placed.', systemActor);

    expect(entry.orderId).toBe(orderId);
    expect(entry.status).toBe(PAYMENT_STATUS.AWAITING_COLLECTION);
    expect(entry.note).toBe('COD order placed.');
    expect(entry.actorType).toBe(ActorType.SYSTEM);

    const stored = await prisma.paymentStatusHistory.findUnique({ where: { id: entry.id } });
    expect(stored?.storeId).toBe(storeId);
  });

  it('appends a second entry with a null note and an admin actor', async () => {
    const entry = await repository.append(orderId, PAYMENT_STATUS.PAID, null, {
      actorId: 'admin-1',
      actorType: ActorType.ADMIN,
    });

    expect(entry.status).toBe(PAYMENT_STATUS.PAID);
    expect(entry.note).toBeNull();
    expect(entry.actorId).toBe('admin-1');
    expect(entry.actorType).toBe(ActorType.ADMIN);
  });

  it('lists entries by orderId in chronological order', async () => {
    const list = await repository.listByOrderId(orderId);

    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.every((entry) => entry.orderId === orderId)).toBe(true);
    for (let i = 1; i < list.length; i++) {
      expect(list[i]!.createdAt.getTime()).toBeGreaterThanOrEqual(list[i - 1]!.createdAt.getTime());
    }
  });

  it('returns an empty list for an order with no payment status history', async () => {
    const otherOrder = await prisma.order.create({
      data: {
        storeId,
        orderNumber: `ORD-TEST-${randomUUID()}`,
        customerNameSnapshot: 'Demo Customer',
        customerEmailSnapshot: 'demo@example.com',
        customerPhoneSnapshot: '+9647700000000',
        shippingFullName: 'Demo Customer',
        shippingPhone: '+9647700000000',
        shippingLine1: '123 Al-Rasheed Street',
        shippingCity: 'Baghdad',
        shippingGovernorate: 'Baghdad',
        shippingCountry: 'Iraq',
        subtotal: '10000',
        total: '10000',
        paymentMethod: 'COD',
      },
    });

    expect(await repository.listByOrderId(otherOrder.id)).toEqual([]);
  });
});
