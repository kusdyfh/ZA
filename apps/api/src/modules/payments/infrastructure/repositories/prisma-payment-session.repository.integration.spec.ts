import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaPaymentSessionRepository } from './prisma-payment-session.repository';
import { PAYMENT_PROVIDER } from '../../domain/constants/payment-provider.constants';
import { PAYMENT_SESSION_STATUS } from '../../domain/constants/payment-session-status.constants';
import { PaymentSessionNotFoundError } from '../../domain/errors/payment.errors';

describe('PrismaPaymentSessionRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaPaymentSessionRepository(prisma);
  let storeId: string;

  async function createOrder(): Promise<string> {
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
        paymentMethod: 'CARD',
      },
    });
    return order.id;
  }

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Payment Session Integration Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;
  });

  afterAll(async () => {
    await prisma.paymentSession.deleteMany({ where: { storeId } });
    await prisma.order.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates a PENDING session with the pendingOrderSnapshot preserved', async () => {
    const providerSessionId = `pi_${randomUUID()}`;
    const session = await repository.create({
      storeId,
      provider: PAYMENT_PROVIDER.STRIPE,
      providerSessionId,
      pendingOrderSnapshot: { orderNumber: 'ORD-TEST-1', total: 83000 },
      amount: 83000,
      currencyCode: 'IQD',
      expiresAt: new Date(Date.now() + 60 * 60_000),
    });

    expect(session.status).toBe(PAYMENT_SESSION_STATUS.PENDING);
    expect(session.providerSessionId).toBe(providerSessionId);
    expect(session.pendingOrderSnapshot).toEqual({ orderNumber: 'ORD-TEST-1', total: 83000 });
    expect(session.amount).toBe(83000);
    expect(session.orderId).toBeNull();
  });

  it('finds by id, scoped to the store', async () => {
    const created = await repository.create({
      storeId,
      provider: PAYMENT_PROVIDER.STRIPE,
      providerSessionId: `pi_${randomUUID()}`,
      pendingOrderSnapshot: {},
      amount: 1000,
      currencyCode: 'IQD',
      expiresAt: new Date(Date.now() + 60_000),
    });

    expect((await repository.findById(storeId, created.id))?.id).toBe(created.id);
    expect(await repository.findById('some-other-store', created.id)).toBeNull();
  });

  it('finds by providerSessionId', async () => {
    const providerSessionId = `pi_${randomUUID()}`;
    const created = await repository.create({
      storeId,
      provider: PAYMENT_PROVIDER.STRIPE,
      providerSessionId,
      pendingOrderSnapshot: {},
      amount: 1000,
      currencyCode: 'IQD',
      expiresAt: new Date(Date.now() + 60_000),
    });

    expect((await repository.findByProviderSessionId(providerSessionId))?.id).toBe(created.id);
    expect(await repository.findByProviderSessionId('pi_does_not_exist')).toBeNull();
  });

  it('markSucceeded() sets status SUCCEEDED and links the orderId', async () => {
    const orderId = await createOrder();
    const created = await repository.create({
      storeId,
      provider: PAYMENT_PROVIDER.STRIPE,
      providerSessionId: `pi_${randomUUID()}`,
      pendingOrderSnapshot: {},
      amount: 83000,
      currencyCode: 'IQD',
      expiresAt: new Date(Date.now() + 60_000),
    });

    const succeeded = await repository.markSucceeded(created.id, orderId);

    expect(succeeded.status).toBe(PAYMENT_SESSION_STATUS.SUCCEEDED);
    expect(succeeded.orderId).toBe(orderId);
  });

  it('markFailed() sets status FAILED', async () => {
    const created = await repository.create({
      storeId,
      provider: PAYMENT_PROVIDER.STRIPE,
      providerSessionId: `pi_${randomUUID()}`,
      pendingOrderSnapshot: {},
      amount: 1000,
      currencyCode: 'IQD',
      expiresAt: new Date(Date.now() + 60_000),
    });

    const failed = await repository.markFailed(created.id);

    expect(failed.status).toBe(PAYMENT_SESSION_STATUS.FAILED);
  });

  it('throws PaymentSessionNotFoundError when marking an unknown session succeeded/failed', async () => {
    await expect(repository.markSucceeded('missing-session', 'order-x')).rejects.toThrow(
      PaymentSessionNotFoundError,
    );
    await expect(repository.markFailed('missing-session')).rejects.toThrow(PaymentSessionNotFoundError);
  });
});
