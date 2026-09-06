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
 * ADR 0017 §1/§5 — login success/failure and the LoginHistory audit
 * trail it writes. A fresh app instance per file keeps the login
 * endpoint's rate limiter (5/60s) scoped to this file's own handful of
 * calls — see the file-splitting note in this epic's completion summary.
 */
describe('Auth: login + login history (integration)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  let testAdminId: string;
  let testAdminEmail: string;

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
    const role = await prisma.role.findFirstOrThrow({ where: { key: 'SALES' } });
    const testAdmin = await createTestAdmin(prisma, role.id, 'login-history');
    testAdminId = testAdmin.id;
    testAdminEmail = testAdmin.email;
  });

  afterAll(async () => {
    await deleteTestAdmin(prisma, testAdminId);
    await app.close();
  });

  it('logs in successfully and returns access + refresh tokens', async () => {
    const response = await request(server)
      .post('/v1/auth/login')
      .send({ email: testAdminEmail, password: TEST_ADMIN_PASSWORD });

    expect(response.status).toBe(201);
    const body = ok<{ accessToken: string; refreshToken: string; adminUser: { id: string } }>(
      response,
    );
    expect(body.data.accessToken).toEqual(expect.any(String));
    expect(body.data.refreshToken).toEqual(expect.any(String));
    expect(body.data.adminUser.id).toBe(testAdminId);
  });

  it('rejects a wrong password with a generic error, never revealing which field was wrong', async () => {
    const response = await request(server)
      .post('/v1/auth/login')
      .send({ email: testAdminEmail, password: 'totally-wrong-password' });

    expect(response.status).toBe(401);
    expect(err(response).error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects an unknown email with the exact same generic error', async () => {
    const response = await request(server)
      .post('/v1/auth/login')
      .send({ email: 'no-such-admin@example.com', password: 'whatever12345' });

    expect(response.status).toBe(401);
    expect(err(response).error.code).toBe('INVALID_CREDENTIALS');
  });

  it("records every attempt above in the caller's own login history, without exposing failureReason", async () => {
    const login = await request(server)
      .post('/v1/auth/login')
      .send({ email: testAdminEmail, password: TEST_ADMIN_PASSWORD });
    const accessToken = ok<{ accessToken: string }>(login).data.accessToken;

    const history = await request(server)
      .get('/v1/auth/login-history')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(history.status).toBe(200);
    const entries = ok<Array<{ success: boolean; emailAttempted: string }>>(history).data;
    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(entries.some((entry) => entry.success === true)).toBe(true);
    expect(entries.some((entry) => entry.success === false)).toBe(true);
    expect(entries.every((entry) => !('failureReason' in entry))).toBe(true);
  });
});
