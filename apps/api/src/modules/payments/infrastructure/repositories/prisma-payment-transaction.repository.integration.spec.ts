import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaOutboxRepository } from '../../../../infrastructure/events/prisma-outbox.repository';
import { PrismaPaymentTransactionRepository } from './prisma-payment-transaction.repository';
import { PAYMENT_PROVIDER } from '../../domain/constants/payment-provider.constants';
import { PAYMENT_TRANSACTION_STATUS, PAYMENT_TRANSACTION_TYPE } from '../../domain/constants/payment-transaction.constants';

describe('PrismaPaymentTransactionRepository (integration)', () => {
  const prisma = new PrismaService();
  const outbox = new PrismaOutboxRepository(prisma);
  const repository = new PrismaPaymentTransactionRepository(prisma, outbox);
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
        subtotal: '83000',
        total: '83000',
        paymentMethod: 'CARD',
      },
    });
    return { id: order.id, orderNumber };
  }

  async function createPaymentSession(customerEmailSnapshot: string): Promise<string> {
    const session = await prisma.paymentSession.create({
      data: {
        storeId,
        provider: 'STRIPE',
        providerSessionId: `pi_${randomUUID()}`,
        pendingOrderSnapshot: { customerEmailSnapshot },
        amount: '83000',
        currencyCode: 'IQD',
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    return session.id;
  }

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Payment Transaction Integration Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;
  });

  afterAll(async () => {
    await prisma.outboxEvent.deleteMany({ where: { storeId } });
    await prisma.paymentTransaction.deleteMany({ where: { storeId } });
    await prisma.paymentSession.deleteMany({ where: { storeId } });
    await prisma.order.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates an AUTHORIZATION transaction and writes no outbox event', async () => {
    const order = await createOrder();
    const txn = await repository.create({
      storeId,
      orderId: order.id,
      provider: PAYMENT_PROVIDER.STRIPE,
      type: PAYMENT_TRANSACTION_TYPE.AUTHORIZATION,
      status: PAYMENT_TRANSACTION_STATUS.SUCCEEDED,
      amount: 83000,
      currencyCode: 'IQD',
    });

    const event = await prisma.outboxEvent.findFirst({ where: { aggregateId: txn.id } });
    expect(event).toBeNull();
  });

  it('creates a CAPTURE transaction linked to an order and writes a PaymentCaptured outbox event', async () => {
    const order = await createOrder();
    const txn = await repository.create({
      storeId,
      orderId: order.id,
      provider: PAYMENT_PROVIDER.STRIPE,
      type: PAYMENT_TRANSACTION_TYPE.CAPTURE,
      status: PAYMENT_TRANSACTION_STATUS.SUCCEEDED,
      amount: 83000,
      currencyCode: 'IQD',
      providerReference: 'ch_123',
    });

    expect(txn.type).toBe(PAYMENT_TRANSACTION_TYPE.CAPTURE);
    expect(txn.providerReference).toBe('ch_123');

    const event = await prisma.outboxEvent.findFirst({
      where: { aggregateId: txn.id, eventType: 'PaymentCaptured' },
    });
    expect(event).not.toBeNull();
    const payload = event?.payload as { orderId: string; orderNumber: string; customerEmail: string; amount: number; provider: string };
    expect(payload.orderId).toBe(order.id);
    expect(payload.orderNumber).toBe(order.orderNumber);
    expect(payload.customerEmail).toBe('demo@example.com');
    expect(payload.amount).toBe(83000);
    expect(payload.provider).toBe('STRIPE');
  });

  it('a CAPTURE transaction with no orderId writes no outbox event', async () => {
    const txn = await repository.create({
      storeId,
      provider: PAYMENT_PROVIDER.STRIPE,
      type: PAYMENT_TRANSACTION_TYPE.CAPTURE,
      status: PAYMENT_TRANSACTION_STATUS.SUCCEEDED,
      amount: 1000,
      currencyCode: 'IQD',
    });

    const event = await prisma.outboxEvent.findFirst({ where: { aggregateId: txn.id } });
    expect(event).toBeNull();
  });

  it('creates a FAILURE transaction linked to a payment session and writes a PaymentFailed outbox event using the snapshot email', async () => {
    const sessionId = await createPaymentSession('failed-checkout@example.com');
    const txn = await repository.create({
      storeId,
      paymentSessionId: sessionId,
      provider: PAYMENT_PROVIDER.STRIPE,
      type: PAYMENT_TRANSACTION_TYPE.FAILURE,
      status: PAYMENT_TRANSACTION_STATUS.FAILED,
      amount: 83000,
      currencyCode: 'IQD',
      failureReason: 'card_declined',
    });

    expect(txn.status).toBe(PAYMENT_TRANSACTION_STATUS.FAILED);
    expect(txn.failureReason).toBe('card_declined');

    const event = await prisma.outboxEvent.findFirst({
      where: { aggregateId: txn.id, eventType: 'PaymentFailed' },
    });
    expect(event).not.toBeNull();
    const payload = event?.payload as { paymentSessionId: string; customerEmail: string | null; reason: string | null };
    expect(payload.paymentSessionId).toBe(sessionId);
    expect(payload.customerEmail).toBe('failed-checkout@example.com');
    expect(payload.reason).toBe('card_declined');
  });

  it('a FAILURE transaction with no paymentSessionId still writes a PaymentFailed event with a null customerEmail', async () => {
    const txn = await repository.create({
      storeId,
      provider: PAYMENT_PROVIDER.STRIPE,
      type: PAYMENT_TRANSACTION_TYPE.FAILURE,
      status: PAYMENT_TRANSACTION_STATUS.FAILED,
      amount: 1000,
      currencyCode: 'IQD',
      failureReason: 'network_error',
    });

    const event = await prisma.outboxEvent.findFirst({
      where: { aggregateId: txn.id, eventType: 'PaymentFailed' },
    });
    expect(event).not.toBeNull();
    const payload = event?.payload as { customerEmail: string | null };
    expect(payload.customerEmail).toBeNull();
  });

  it('creates a REFUND transaction linked to an order and writes a PaymentRefunded outbox event', async () => {
    const order = await createOrder();
    const txn = await repository.create({
      storeId,
      orderId: order.id,
      provider: PAYMENT_PROVIDER.STRIPE,
      type: PAYMENT_TRANSACTION_TYPE.REFUND,
      status: PAYMENT_TRANSACTION_STATUS.SUCCEEDED,
      amount: 20000,
      currencyCode: 'IQD',
    });

    const event = await prisma.outboxEvent.findFirst({
      where: { aggregateId: txn.id, eventType: 'PaymentRefunded' },
    });
    expect(event).not.toBeNull();
    const payload = event?.payload as { orderId: string; orderNumber: string; amount: number };
    expect(payload.orderId).toBe(order.id);
    expect(payload.orderNumber).toBe(order.orderNumber);
    expect(payload.amount).toBe(20000);
  });

  it('lists transactions by orderId, most recent first', async () => {
    const order = await createOrder();
    const first = await repository.create({
      storeId,
      orderId: order.id,
      provider: PAYMENT_PROVIDER.STRIPE,
      type: PAYMENT_TRANSACTION_TYPE.AUTHORIZATION,
      status: PAYMENT_TRANSACTION_STATUS.SUCCEEDED,
      amount: 83000,
      currencyCode: 'IQD',
    });
    const second = await repository.create({
      storeId,
      orderId: order.id,
      provider: PAYMENT_PROVIDER.STRIPE,
      type: PAYMENT_TRANSACTION_TYPE.CAPTURE,
      status: PAYMENT_TRANSACTION_STATUS.SUCCEEDED,
      amount: 83000,
      currencyCode: 'IQD',
    });

    const list = await repository.listByOrderId(order.id);
    expect(list.map((t) => t.id).sort()).toEqual([first.id, second.id].sort());
    // Ordered most-recent-first: the first item's createdAt is never before the second's.
    expect(list[0]!.createdAt.getTime()).toBeGreaterThanOrEqual(list[1]!.createdAt.getTime());
  });
});
