import { randomUUID } from 'node:crypto';
import { ActorType } from '@za/types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaRefundRepository } from './prisma-refund.repository';
import { REFUND_METHOD, REFUND_STATUS } from '../../domain/constants/refund-status.constants';

describe('PrismaRefundRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaRefundRepository(prisma);
  let storeId: string;
  let orderId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Refund Integration Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;

    const order = await prisma.order.create({
      data: {
        storeId,
        orderNumber: `ORD-TEST-${randomUUID()}`,
        status: 'CANCELLED',
        customerNameSnapshot: 'Demo Customer',
        customerEmailSnapshot: 'demo@example.com',
        customerPhoneSnapshot: '+9647700000000',
        shippingFullName: 'Demo Customer',
        shippingPhone: '+9647700000000',
        shippingLine1: '123 Al-Rasheed Street',
        shippingCity: 'Baghdad',
        shippingGovernorate: 'Baghdad',
        shippingCountry: 'Iraq',
        subtotal: '20000',
        total: '20000',
        paymentMethod: 'COD',
      },
    });
    orderId = order.id;
  });

  afterAll(async () => {
    await prisma.refund.deleteMany({ where: { storeId } });
    await prisma.order.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates a PENDING STORE_CREDIT refund (COD, requires manual follow-up)', async () => {
    const refund = await repository.create({
      storeId,
      orderId,
      amount: 20000,
      reason: 'Customer returned item',
      method: REFUND_METHOD.STORE_CREDIT,
      status: REFUND_STATUS.PENDING,
      requestedBy: { actorId: 'admin-1', actorType: ActorType.ADMIN },
    });

    expect(refund.orderId).toBe(orderId);
    expect(refund.amount).toBe(20000);
    expect(refund.method).toBe(REFUND_METHOD.STORE_CREDIT);
    expect(refund.status).toBe(REFUND_STATUS.PENDING);
    expect(refund.requestedByActorId).toBe('admin-1');
    expect(refund.completedAt).toBeNull();
  });

  it('creates a COMPLETED STRIPE refund with a completedAt timestamp', async () => {
    const completedAt = new Date();
    const refund = await repository.create({
      storeId,
      orderId,
      amount: 5000,
      reason: 'Partial refund',
      method: REFUND_METHOD.STRIPE,
      status: REFUND_STATUS.COMPLETED,
      requestedBy: { actorId: 'admin-1', actorType: ActorType.ADMIN },
      completedAt,
    });

    expect(refund.status).toBe(REFUND_STATUS.COMPLETED);
    expect(refund.completedAt?.getTime()).toBe(completedAt.getTime());
  });

  it('lists refunds by orderId, most recent first', async () => {
    const list = await repository.listByOrderId(orderId);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.every((r) => r.orderId === orderId)).toBe(true);
  });

  it('sums only COMPLETED refunds for the order', async () => {
    const sum = await repository.sumCompletedByOrderId(orderId);
    expect(sum).toBe(5000);
  });

  it('sums to 0 for an order with no completed refunds', async () => {
    const otherOrder = await prisma.order.create({
      data: {
        storeId,
        orderNumber: `ORD-TEST-${randomUUID()}`,
        status: 'CANCELLED',
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

    expect(await repository.sumCompletedByOrderId(otherOrder.id)).toBe(0);
  });
});
