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
 * ADR 0017 §1–2 — refresh token rotation, family-based reuse detection,
 * and logout. Own app instance per file, same rate-limit-scoping reason
 * as the sibling `auth-*.integration.spec.ts` files.
 */
describe('Auth: refresh rotation + logout (integration)', () => {
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
    const testAdmin = await createTestAdmin(prisma, role.id, 'refresh-rotation');
    testAdminId = testAdmin.id;
    testAdminEmail = testAdmin.email;
  });

  afterAll(async () => {
    await deleteTestAdmin(prisma, testAdminId);
    await app.close();
  });

  it('rotates the refresh token on use and detects reuse of an already-rotated one', async () => {
    const login = await request(server)
      .post('/v1/auth/login')
      .send({ email: testAdminEmail, password: TEST_ADMIN_PASSWORD });
    const originalRefreshToken = ok<{ refreshToken: string }>(login).data.refreshToken;

    const firstRefresh = await request(server)
      .post('/v1/auth/refresh')
      .send({ refreshToken: originalRefreshToken });
    expect(firstRefresh.status).toBe(201);
    const rotated = ok<{ accessToken: string; refreshToken: string }>(firstRefresh).data;
    expect(rotated.refreshToken).not.toBe(originalRefreshToken);

    // Reusing the already-rotated original token is a reuse-detection signal.
    const reuseAttempt = await request(server)
      .post('/v1/auth/refresh')
      .send({ refreshToken: originalRefreshToken });
    expect(reuseAttempt.status).toBe(401);
    expect(err(reuseAttempt).error.code).toBe('REFRESH_TOKEN_REUSED');

    // Reuse detection revokes the *entire family* — even the token that
    // was validly rotated a moment ago is now dead too.
    const rotatedNowInvalid = await request(server)
      .post('/v1/auth/refresh')
      .send({ refreshToken: rotated.refreshToken });
    expect(rotatedNowInvalid.status).toBe(401);
  });

  it('logout revokes the session so a subsequent refresh fails', async () => {
    const login = await request(server)
      .post('/v1/auth/login')
      .send({ email: testAdminEmail, password: TEST_ADMIN_PASSWORD });
    const { accessToken, refreshToken } = ok<{ accessToken: string; refreshToken: string }>(
      login,
    ).data;

    const logout = await request(server)
      .post('/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });
    expect(logout.status).toBe(204);

    // A logged-out token is marked revoked exactly like a rotated one, so
    // RefreshAccessTokenUseCase can't (and doesn't need to) distinguish
    // "revoked by logout" from "revoked by rotation" — both surface as
    // the same reuse-detection error.
    const refreshAfterLogout = await request(server)
      .post('/v1/auth/refresh')
      .send({ refreshToken });
    expect(refreshAfterLogout.status).toBe(401);
    expect(err(refreshAfterLogout).error.code).toBe('REFRESH_TOKEN_REUSED');
  });
});
