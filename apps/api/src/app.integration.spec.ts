import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';
import { ResponseEnvelopeInterceptor } from './shared/interceptors/response-envelope.interceptor';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import {
  ok,
  err,
  createTestAdmin,
  deleteTestAdmin,
  TEST_ADMIN_PASSWORD,
} from './shared/testing/auth-integration-helpers';

/**
 * Full-stack HTTP integration tests against real Postgres — the actual
 * NestJS pipeline (guards, pipes, interceptor, exception filter), not
 * just use-cases/repositories in isolation. Covers ADR 0016's pagination/
 * sort/search and DomainError -> HTTP status mapping, and ADR 0017's
 * `JwtAuthGuard`/`@Public()` split (replacing the old
 * `TemporaryAdminGuard`/`x-admin-user-id` flow this file used before
 * Epic 7) — plus one full guest storefront-to-order flow proving every
 * layer wired across both epics actually works together. Login/refresh/
 * permission-guard specifics live in the dedicated `auth-*.integration.spec.ts`
 * files instead of here.
 */
describe('API Layer (integration)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  let testAdminId: string;
  let accessToken: string;

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

    const superAdminRole = await prisma.role.findFirstOrThrow({ where: { key: 'SUPER_ADMIN' } });
    const testAdmin = await createTestAdmin(prisma, superAdminRole.id, 'app-integration');
    testAdminId = testAdmin.id;

    const login = await request(server)
      .post('/v1/auth/login')
      .send({ email: testAdmin.email, password: TEST_ADMIN_PASSWORD });
    accessToken = ok<{ accessToken: string }>(login).data.accessToken;
  });

  afterAll(async () => {
    await deleteTestAdmin(prisma, testAdminId);
    await app.close();
  });

  describe('JwtAuthGuard', () => {
    it('rejects a guarded route with no Authorization header (401)', async () => {
      const response = await request(server).get('/v1/identity/admin-users');
      expect(response.status).toBe(401);
      expect(err(response).success).toBe(false);
    });

    it('rejects a guarded route with a malformed/invalid token (401)', async () => {
      const response = await request(server)
        .get('/v1/identity/admin-users')
        .set('Authorization', 'Bearer not-a-real-token');
      expect(response.status).toBe(401);
    });

    it('allows a guarded route with a valid access token', async () => {
      const response = await request(server)
        .get('/v1/identity/admin-users')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(200);
      const body = ok<unknown[]>(response);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('allows a @Public() route with no Authorization header at all', async () => {
      const response = await request(server).get('/v1/catalog/brands');
      expect(response.status).toBe(200);
      expect(ok(response).success).toBe(true);
    });
  });

  describe('Exception mapping', () => {
    it('maps a *NotFoundError DomainError to 404 with its own error code', async () => {
      const response = await request(server).get('/v1/catalog/collections/does-not-exist/products');
      expect(response.status).toBe(404);
      expect(err(response).error.code).toBe('COLLECTION_NOT_FOUND');
    });

    it('maps a class-validator failure to 400 VALIDATION_FAILED', async () => {
      const response = await request(server)
        .post('/v1/catalog/brands')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});
      expect(response.status).toBe(400);
      expect(err(response).error.code).toBe('VALIDATION_FAILED');
    });
  });

  describe('Pagination, sorting, and search', () => {
    const cleanupIds: string[] = [];

    afterAll(async () => {
      await prisma.tag.deleteMany({ where: { id: { in: cleanupIds } } });
    });

    it('paginates, sorts, and searches a list endpoint', async () => {
      const suffix = randomUUID().slice(0, 8);
      const names = [`Alpha-${suffix}`, `Beta-${suffix}`, `Gamma-${suffix}`];
      for (const name of names) {
        const response = await request(server)
          .post('/v1/catalog/tags')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ name });
        cleanupIds.push(ok<{ id: string }>(response).data.id);
      }

      const searchResponse = await request(server).get(
        `/v1/catalog/tags?search=${suffix}&limit=2&sort=name:asc`,
      );
      const body = ok<{ name: string }[]>(searchResponse);

      expect(searchResponse.status).toBe(200);
      expect(body.meta?.total).toBe(3);
      expect(body.meta?.limit).toBe(2);
      expect(body.data).toHaveLength(2);
      expect(body.data[0]?.name).toBe(`Alpha-${suffix}`);
      expect(body.data[1]?.name).toBe(`Beta-${suffix}`);
    });
  });

  describe('Full guest storefront -> cart -> checkout -> order flow', () => {
    it('browses, adds to cart, places an order, and reads it back as staff', async () => {
      const guestToken = `guest-${randomUUID()}`;

      const variant = await prisma.productVariant.findFirstOrThrow({
        where: { sku: 'ZA-PANT-RELAX-001-BLK-M' },
      });
      const shippingMethod = await prisma.shippingMethod.findFirstOrThrow({
        where: { name: 'Standard Delivery' },
      });

      const featured = await request(server).get('/v1/catalog/storefront/best-sellers');
      expect(featured.status).toBe(200);

      const addItem = await request(server)
        .post('/v1/checkout/cart/items')
        .send({ guestToken, variantId: variant.id, quantity: 1 });
      expect(addItem.status).toBe(201);

      const cart = await request(server).get(`/v1/checkout/cart?guestToken=${guestToken}`);
      const cartBody = ok<{ items: unknown[] }>(cart);
      expect(cart.status).toBe(200);
      expect(cartBody.data.items).toHaveLength(1);

      const placeOrder = await request(server)
        .post('/v1/checkout/place-order')
        .send({
          guestToken,
          customerName: 'Integration Test Customer',
          customerEmail: 'integration-test@example.com',
          customerPhone: '+9647700000000',
          shippingFullName: 'Integration Test Customer',
          shippingPhone: '+9647700000000',
          shippingLine1: '1 Test Street',
          shippingCity: 'Baghdad',
          shippingGovernorate: 'Baghdad',
          shippingCountry: 'Iraq',
          shippingMethodId: shippingMethod.id,
          paymentMethod: 'COD',
        });
      const orderBody = ok<{ id: string; status: string; paymentStatus: string; items: unknown[] }>(
        placeOrder,
      );

      expect(placeOrder.status).toBe(201);
      expect(orderBody.data.status).toBe('CONFIRMED');
      expect(orderBody.data.paymentStatus).toBe('AWAITING_COLLECTION');
      const orderId = orderBody.data.id;

      const getOrderUnauthenticated = await request(server).get(`/v1/orders/${orderId}`);
      expect(getOrderUnauthenticated.status).toBe(401);

      const getOrderAsStaff = await request(server)
        .get(`/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      const staffOrderBody = ok<{ id: string; items: unknown[] }>(getOrderAsStaff);
      expect(getOrderAsStaff.status).toBe(200);
      expect(staffOrderBody.data.id).toBe(orderId);
      expect(staffOrderBody.data.items).toHaveLength(1);

      // CancelOrderDto (Epic 5) still requires `orderId` in the body even
      // though the controller reads it from the URL param — a pre-existing
      // DTO shape, not something this epic changes.
      const cancel = await request(server)
        .post(`/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ orderId, reason: 'Integration test cleanup' });
      const cancelBody = ok<{ status: string }>(cancel);
      expect(cancel.status).toBe(201);
      expect(cancelBody.data.status).toBe('CANCELLED');
    });
  });
});
