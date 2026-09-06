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
 * ADR 0017 §4 — change-password (authenticated, current-password
 * verified) and the request/reset password flow (public, dev-mode
 * token reveal). Both revoke every existing session on success. Own app
 * instance per file for the same rate-limit-scoping reason as the
 * sibling `auth-*.integration.spec.ts` files; the two tests below are
 * deliberately merged (rather than split further) to stay comfortably
 * under the login endpoint's 5-per-60s throttle.
 */
describe('Auth: password management (integration)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  let changePasswordAdminId: string;
  let resetPasswordAdminId: string;

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
    await deleteTestAdmin(prisma, changePasswordAdminId);
    await deleteTestAdmin(prisma, resetPasswordAdminId);
    await app.close();
  });

  it('rejects a wrong current password, then changes it and revokes every session', async () => {
    const role = await prisma.role.findFirstOrThrow({ where: { key: 'SALES' } });
    const admin = await createTestAdmin(prisma, role.id, 'change-password');
    changePasswordAdminId = admin.id;

    const login = await request(server)
      .post('/v1/auth/login')
      .send({ email: admin.email, password: TEST_ADMIN_PASSWORD });
    const { accessToken, refreshToken } = ok<{ accessToken: string; refreshToken: string }>(
      login,
    ).data;

    const wrongAttempt = await request(server)
      .post('/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'not-the-right-password', newPassword: 'SomeOtherPassword123' });
    expect(wrongAttempt.status).toBe(401);
    expect(err(wrongAttempt).error.code).toBe('INVALID_CREDENTIALS');

    const newPassword = 'BrandNewPassword98765';
    const change = await request(server)
      .post('/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: TEST_ADMIN_PASSWORD, newPassword });
    expect(change.status).toBe(204);

    // Changing the password revokes every existing session, including the
    // one that was active when the change was made.
    const refreshAfterChange = await request(server)
      .post('/v1/auth/refresh')
      .send({ refreshToken });
    expect(refreshAfterChange.status).toBe(401);

    const loginWithOldPassword = await request(server)
      .post('/v1/auth/login')
      .send({ email: admin.email, password: TEST_ADMIN_PASSWORD });
    expect(loginWithOldPassword.status).toBe(401);

    const loginWithNewPassword = await request(server)
      .post('/v1/auth/login')
      .send({ email: admin.email, password: newPassword });
    expect(loginWithNewPassword.status).toBe(201);
  });

  it('requests a reset (dev-mode reveals the token), resets, and the new password logs in', async () => {
    const role = await prisma.role.findFirstOrThrow({ where: { key: 'SALES' } });
    const admin = await createTestAdmin(prisma, role.id, 'reset-password');
    resetPasswordAdminId = admin.id;

    const requestReset = await request(server)
      .post('/v1/auth/request-password-reset')
      .send({ email: admin.email });
    expect(requestReset.status).toBe(201);
    const resetToken = ok<{ resetToken?: string }>(requestReset).data.resetToken;
    expect(resetToken).toEqual(expect.any(String));

    const newPassword = 'ResetFlowPassword54321';
    const reset = await request(server)
      .post('/v1/auth/reset-password')
      .send({ token: resetToken, newPassword });
    expect(reset.status).toBe(204);

    // A reset token is single-use. InvalidPasswordResetTokenError maps to
    // 401 (an authentication-adjacent failure, per ADR 0017 §7's classifier),
    // not 400 — the token itself, not the request shape, is invalid.
    const reuseAttempt = await request(server)
      .post('/v1/auth/reset-password')
      .send({ token: resetToken, newPassword: 'AnotherPassword11111' });
    expect(reuseAttempt.status).toBe(401);
    expect(err(reuseAttempt).error.code).toBe('INVALID_PASSWORD_RESET_TOKEN');

    const loginWithNewPassword = await request(server)
      .post('/v1/auth/login')
      .send({ email: admin.email, password: newPassword });
    expect(loginWithNewPassword.status).toBe(201);
  });

  it('never reveals whether an email exists on request-password-reset', async () => {
    const response = await request(server)
      .post('/v1/auth/request-password-reset')
      .send({ email: 'no-such-admin-anywhere@example.com' });

    expect(response.status).toBe(201);
    const body = ok<{ resetToken?: string; message: string }>(response).data;
    expect(body.resetToken).toBeUndefined();
    expect(body.message).toEqual(expect.any(String));
  });
});
