import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { ResponseEnvelopeInterceptor } from '../../../shared/interceptors/response-envelope.interceptor';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  ok,
  createTestAdmin,
  deleteTestAdmin,
  TEST_ADMIN_PASSWORD,
} from '../../../shared/testing/auth-integration-helpers';

/**
 * ADR 0018 §3/§4 — guest cart merge into a customer's own persistent
 * cartToken, the guest-order-association email-match backfill at
 * register/login time, and order history (customer's own view + staff
 * support lookup, reusing CUSTOMERS_VIEW).
 */
describe('Customers: guest cart merge + guest order association + order history (integration)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  let customerId: string;
  let supportAdminId: string;
  let placedOrderId: string;
  let staffAccessToken: string;
  const testEmail = `guest-merge-${randomUUID()}@example.com`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: ['health', 'health/ready'] });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();
    server = app.getHttpServer() as Server;
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    // Cancel the placed order to restock the shared seeded variant —
    // otherwise repeated test runs would slowly deplete its stock.
    if (placedOrderId && staffAccessToken) {
      await request(server)
        .post(`/v1/orders/${placedOrderId}/cancel`)
        .set('Authorization', `Bearer ${staffAccessToken}`)
        .send({ orderId: placedOrderId, reason: 'Integration test cleanup' });
    }

    await prisma.customerRefreshToken.deleteMany({ where: { customerId } });
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (customer) {
      await prisma.cart.deleteMany({ where: { guestToken: customer.cartToken } });
    }
    await prisma.customer.deleteMany({ where: { id: customerId } });
    await deleteTestAdmin(prisma, supportAdminId);
    await app.close();
  });

  it('merges a guest cart into the new customer cartToken on registration', async () => {
    const guestToken = `guest-${randomUUID()}`;
    const variant = await prisma.productVariant.findFirstOrThrow();

    const addItem = await request(server)
      .post('/v1/checkout/cart/items')
      .send({ guestToken, variantId: variant.id, quantity: 1 });
    expect(addItem.status).toBe(201);

    const register = await request(server)
      .post('/v1/customers/auth/register')
      .send({
        email: testEmail,
        password: 'GuestMergeTest12345',
        firstName: 'Jane',
        lastName: 'Doe',
        guestToken,
      });
    expect(register.status).toBe(201);
    const body = ok<{ customer: { id: string; cartToken: string } }>(register).data;
    customerId = body.customer.id;

    const mergedCart = await request(server).get(`/v1/checkout/cart?guestToken=${body.customer.cartToken}`);
    const cartBody = ok<{ items: Array<{ variantId: string }> }>(mergedCart).data;
    expect(cartBody.items.some((item) => item.variantId === variant.id)).toBe(true);
  });

  it('associates a prior guest order with the same email at login time, and it shows up in order history', async () => {
    const guestToken = `guest-${randomUUID()}`;
    const variant = await prisma.productVariant.findFirstOrThrow({
      where: { sku: 'ZA-PANT-RELAX-001-BLK-M' },
    });
    const shippingMethod = await prisma.shippingMethod.findFirstOrThrow({
      where: { name: 'Standard Delivery' },
    });

    await request(server)
      .post('/v1/checkout/cart/items')
      .send({ guestToken, variantId: variant.id, quantity: 1 });

    const placeOrder = await request(server)
      .post('/v1/checkout/place-order')
      .send({
        guestToken,
        customerName: 'Jane Doe',
        customerEmail: testEmail,
        customerPhone: '+9647700000000',
        shippingFullName: 'Jane Doe',
        shippingPhone: '+9647700000000',
        shippingLine1: '1 Test Street',
        shippingCity: 'Baghdad',
        shippingGovernorate: 'Baghdad',
        shippingCountry: 'Iraq',
        shippingMethodId: shippingMethod.id,
        paymentMethod: 'COD',
      });
    expect(placeOrder.status).toBe(201);
    const orderId = ok<{ id: string }>(placeOrder).data.id;
    placedOrderId = orderId;

    // The order was placed as a guest — not yet linked.
    const orderBeforeLogin = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(orderBeforeLogin.customerId).toBeNull();

    const login = await request(server)
      .post('/v1/customers/auth/login')
      .send({ email: testEmail, password: 'GuestMergeTest12345' });
    expect(login.status).toBe(201);
    const accessToken = ok<{ accessToken: string }>(login).data.accessToken;

    const orderAfterLogin = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(orderAfterLogin.customerId).toBe(customerId);

    const history = await request(server)
      .get('/v1/customers/me/orders')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(history.status).toBe(200);
    expect(ok<Array<{ id: string }>>(history).data.some((order) => order.id === orderId)).toBe(true);
  });

  it('lets staff (CUSTOMERS_VIEW) look up the customer profile and order history for support', async () => {
    // MANAGER (not SALES) so the same admin can also cancel the test
    // order in afterAll — SALES has ORDERS_FULFILL but not ORDERS_REFUND.
    const managerRole = await prisma.role.findFirstOrThrow({ where: { key: 'MANAGER' } });
    const supportAdmin = await createTestAdmin(prisma, managerRole.id, 'customer-support');
    supportAdminId = supportAdmin.id;
    const login = await request(server)
      .post('/v1/auth/login')
      .send({ email: supportAdmin.email, password: TEST_ADMIN_PASSWORD });
    const staffToken = ok<{ accessToken: string }>(login).data.accessToken;
    staffAccessToken = staffToken;

    const profile = await request(server)
      .get(`/v1/customers/${customerId}`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(profile.status).toBe(200);
    expect(ok<{ id: string }>(profile).data.id).toBe(customerId);

    const orders = await request(server)
      .get(`/v1/customers/${customerId}/orders`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(orders.status).toBe(200);
    expect(Array.isArray(ok<unknown[]>(orders).data)).toBe(true);
  });
});
