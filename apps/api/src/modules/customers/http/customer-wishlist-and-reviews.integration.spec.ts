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
  err,
  createTestAdmin,
  deleteTestAdmin,
  TEST_ADMIN_PASSWORD,
} from '../../../shared/testing/auth-integration-helpers';

/**
 * ADR 0018 §6/§7 — wishlist (add/remove/list) and reviews (submit/edit,
 * public list + live summary, staff moderation reusing REVIEWS_MODERATE).
 */
describe('Customers: wishlist + reviews (integration)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  let customerId: string;
  let accessToken: string;
  let productId: string;
  let moderatorAdminId: string;
  let moderatorToken: string;
  const testEmail = `wishlist-reviews-${randomUUID()}@example.com`;

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

    const register = await request(server)
      .post('/v1/customers/auth/register')
      .send({ email: testEmail, password: 'WishlistReviewsTest12345', firstName: 'Jane', lastName: 'Doe' });
    const body = ok<{ accessToken: string; customer: { id: string } }>(register).data;
    accessToken = body.accessToken;
    customerId = body.customer.id;

    const product = await prisma.product.findFirstOrThrow();
    productId = product.id;

    const managerRole = await prisma.role.findFirstOrThrow({ where: { key: 'MANAGER' } });
    const moderator = await createTestAdmin(prisma, managerRole.id, 'review-moderator');
    moderatorAdminId = moderator.id;
    const moderatorLogin = await request(server)
      .post('/v1/auth/login')
      .send({ email: moderator.email, password: TEST_ADMIN_PASSWORD });
    moderatorToken = ok<{ accessToken: string }>(moderatorLogin).data.accessToken;
  });

  afterAll(async () => {
    await prisma.review.deleteMany({ where: { customerId } });
    await prisma.wishlistItem.deleteMany({ where: { customerId } });
    await prisma.customerRefreshToken.deleteMany({ where: { customerId } });
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (customer) {
      await prisma.cart.deleteMany({ where: { guestToken: customer.cartToken } });
    }
    await prisma.customer.deleteMany({ where: { id: customerId } });
    await deleteTestAdmin(prisma, moderatorAdminId);
    await app.close();
  });

  it('adds, lists, and removes a wishlist item', async () => {
    const add = await request(server)
      .post(`/v1/customers/me/wishlist/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(add.status).toBe(201);

    const list = await request(server)
      .get('/v1/customers/me/wishlist')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(list.status).toBe(200);
    const items = ok<Array<{ productId: string; availability: string }>>(list).data;
    expect(items.some((item) => item.productId === productId)).toBe(true);

    const remove = await request(server)
      .delete(`/v1/customers/me/wishlist/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(remove.status).toBe(204);

    const listAfterRemove = await request(server)
      .get('/v1/customers/me/wishlist')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(ok<unknown[]>(listAfterRemove).data).toHaveLength(0);
  });

  it('rejects wishlisting with no logged-in customer', async () => {
    const response = await request(server).post(`/v1/customers/me/wishlist/${productId}`);
    expect(response.status).toBe(401);
  });

  it('submits a review, moderates it, and it appears in the public approved list + summary', async () => {
    const submit = await request(server)
      .post(`/v1/catalog/products/${productId}/reviews`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ rating: 5, body: 'Excellent quality.' });
    expect(submit.status).toBe(201);
    const reviewId = ok<{ id: string; status: string }>(submit).data.id;
    expect(ok<{ status: string }>(submit).data.status).toBe('PENDING');

    // Not yet approved — shouldn't show up publicly yet.
    const beforeApproval = await request(server).get(`/v1/catalog/products/${productId}/reviews`);
    const beforeBody = ok<{ reviews: Array<{ id: string }> }>(beforeApproval).data;
    expect(beforeBody.reviews.some((review) => review.id === reviewId)).toBe(false);

    const pending = await request(server)
      .get('/v1/reviews/pending')
      .set('Authorization', `Bearer ${moderatorToken}`);
    expect(pending.status).toBe(200);
    expect(ok<Array<{ id: string }>>(pending).data.some((review) => review.id === reviewId)).toBe(true);

    const moderate = await request(server)
      .post(`/v1/reviews/${reviewId}/moderate`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ approve: true });
    expect(moderate.status).toBe(201);
    expect(ok<{ status: string }>(moderate).data.status).toBe('APPROVED');

    const afterApproval = await request(server).get(`/v1/catalog/products/${productId}/reviews`);
    const afterBody = ok<{
      reviews: Array<{ id: string }>;
      summary: { averageRating: number; reviewCount: number };
    }>(afterApproval).data;
    expect(afterBody.reviews.some((review) => review.id === reviewId)).toBe(true);
    expect(afterBody.summary.reviewCount).toBeGreaterThanOrEqual(1);
  });

  it('re-submitting edits the existing review instead of creating a duplicate', async () => {
    const edit = await request(server)
      .post(`/v1/catalog/products/${productId}/reviews`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ rating: 2, body: 'Changed my mind.' });
    expect(edit.status).toBe(201);
    const body = ok<{ rating: number; status: string }>(edit).data;
    expect(body.rating).toBe(2);
    // Editing an already-approved review resets it to PENDING for re-moderation.
    expect(body.status).toBe('PENDING');

    const reviewCount = await prisma.review.count({ where: { customerId, productId } });
    expect(reviewCount).toBe(1);
  });

  it('rejects moderation from a role without REVIEWS_MODERATE', async () => {
    const warehouseRole = await prisma.role.findFirstOrThrow({ where: { key: 'WAREHOUSE' } });
    const warehouseAdmin = await createTestAdmin(prisma, warehouseRole.id, 'no-moderate');
    const login = await request(server)
      .post('/v1/auth/login')
      .send({ email: warehouseAdmin.email, password: TEST_ADMIN_PASSWORD });
    const token = ok<{ accessToken: string }>(login).data.accessToken;

    const response = await request(server)
      .get('/v1/reviews/pending')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
    expect(err(response).error.code).toBe('FORBIDDEN');

    await deleteTestAdmin(prisma, warehouseAdmin.id);
  });
});
