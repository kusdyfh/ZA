import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { ResponseEnvelopeInterceptor } from '../../../shared/interceptors/response-envelope.interceptor';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ok, err } from '../../../shared/testing/auth-integration-helpers';

/**
 * ADR 0018 §2 — customer registration, login, refresh rotation with
 * reuse detection, and logout. Own app instance so this file's data
 * (a handful of throwaway customer rows) doesn't interact with others.
 */
describe('Customers: registration + login (integration)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  const testEmail = `registration-${randomUUID()}@example.com`;
  const testPassword = 'RegistrationTest12345';

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
    const customer = await prisma.customer.findFirst({ where: { email: testEmail } });
    if (customer) {
      await prisma.customerRefreshToken.deleteMany({ where: { customerId: customer.id } });
      await prisma.cart.deleteMany({ where: { guestToken: customer.cartToken } });
      await prisma.customer.deleteMany({ where: { id: customer.id } });
    }
    await app.close();
  });

  it('registers a new customer and issues tokens + a cartToken', async () => {
    const response = await request(server)
      .post('/v1/customers/auth/register')
      .send({ email: testEmail, password: testPassword, firstName: 'Jane', lastName: 'Doe' });

    expect(response.status).toBe(201);
    const body = ok<{ accessToken: string; refreshToken: string; customer: { id: string; cartToken: string } }>(
      response,
    ).data;
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.customer.cartToken).toEqual(expect.any(String));
  });

  it('rejects registering the same email twice', async () => {
    const response = await request(server)
      .post('/v1/customers/auth/register')
      .send({ email: testEmail, password: testPassword, firstName: 'Jane', lastName: 'Doe' });

    // EmailAlreadyInUseError's class name matches the classifier's
    // AlreadyInUse pattern (ADR 0016 §4), so this is 409, not 400.
    expect(response.status).toBe(409);
    expect(err(response).error.code).toBe('EMAIL_ALREADY_IN_USE');
  });

  it('logs in with the registered credentials', async () => {
    const response = await request(server)
      .post('/v1/customers/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(response.status).toBe(201);
    expect(ok<{ accessToken: string }>(response).data.accessToken).toEqual(expect.any(String));
  });

  it('rejects a wrong password with a generic error', async () => {
    const response = await request(server)
      .post('/v1/customers/auth/login')
      .send({ email: testEmail, password: 'totally-wrong' });

    expect(response.status).toBe(401);
    expect(err(response).error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rotates the refresh token and detects reuse of an already-rotated one', async () => {
    const login = await request(server)
      .post('/v1/customers/auth/login')
      .send({ email: testEmail, password: testPassword });
    const originalRefreshToken = ok<{ refreshToken: string }>(login).data.refreshToken;

    const firstRefresh = await request(server)
      .post('/v1/customers/auth/refresh')
      .send({ refreshToken: originalRefreshToken });
    expect(firstRefresh.status).toBe(201);
    const rotated = ok<{ refreshToken: string }>(firstRefresh).data;
    expect(rotated.refreshToken).not.toBe(originalRefreshToken);

    const reuseAttempt = await request(server)
      .post('/v1/customers/auth/refresh')
      .send({ refreshToken: originalRefreshToken });
    expect(reuseAttempt.status).toBe(401);
    expect(err(reuseAttempt).error.code).toBe('REFRESH_TOKEN_REUSED');
  });

  it('logout revokes the session so a subsequent refresh fails', async () => {
    const login = await request(server)
      .post('/v1/customers/auth/login')
      .send({ email: testEmail, password: testPassword });
    const { accessToken, refreshToken } = ok<{ accessToken: string; refreshToken: string }>(login).data;

    const logout = await request(server)
      .post('/v1/customers/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });
    expect(logout.status).toBe(204);

    const refreshAfterLogout = await request(server)
      .post('/v1/customers/auth/refresh')
      .send({ refreshToken });
    expect(refreshAfterLogout.status).toBe(401);
  });
});
