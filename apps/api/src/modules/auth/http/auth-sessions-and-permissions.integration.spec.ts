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
 * ADR 0017 §3 (session management: list/revoke) and §7 (PermissionGuard
 * — real per-route 403s, replacing ADR 0016's coarse guard). Own app
 * instance per file for the same rate-limit-scoping reason as the
 * sibling `auth-*.integration.spec.ts` files.
 */
describe('Auth: sessions + PermissionGuard (integration)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  let sessionsAdminId: string;
  let otherAdminId: string;
  let warehouseAdminId: string;
  let remainingSessionId: string;

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
    await deleteTestAdmin(prisma, sessionsAdminId);
    await deleteTestAdmin(prisma, otherAdminId);
    await deleteTestAdmin(prisma, warehouseAdminId);
    await app.close();
  });

  it('lists active sessions across two logins and can revoke one', async () => {
    const role = await prisma.role.findFirstOrThrow({ where: { key: 'SALES' } });
    const admin = await createTestAdmin(prisma, role.id, 'sessions');
    sessionsAdminId = admin.id;

    await request(server)
      .post('/v1/auth/login')
      .send({ email: admin.email, password: TEST_ADMIN_PASSWORD });
    const loginB = await request(server)
      .post('/v1/auth/login')
      .send({ email: admin.email, password: TEST_ADMIN_PASSWORD });
    const tokenB = ok<{ accessToken: string }>(loginB).data.accessToken;

    const listResponse = await request(server)
      .get('/v1/auth/sessions')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(listResponse.status).toBe(200);
    const sessions = ok<Array<{ id: string }>>(listResponse).data;
    expect(sessions).toHaveLength(2);

    const revoke = await request(server)
      .delete(`/v1/auth/sessions/${sessions[0]!.id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(revoke.status).toBe(204);

    const listAfterRevoke = await request(server)
      .get('/v1/auth/sessions')
      .set('Authorization', `Bearer ${tokenB}`);
    const remaining = ok<Array<{ id: string }>>(listAfterRevoke).data;
    expect(remaining).toHaveLength(1);
    remainingSessionId = remaining[0]!.id;
  });

  it("rejects revoking a session id that belongs to a different admin (404, not a cross-account leak)", async () => {
    const role = await prisma.role.findFirstOrThrow({ where: { key: 'SALES' } });
    const other = await createTestAdmin(prisma, role.id, 'other-admin');
    otherAdminId = other.id;

    const login = await request(server)
      .post('/v1/auth/login')
      .send({ email: other.email, password: TEST_ADMIN_PASSWORD });
    const accessToken = ok<{ accessToken: string }>(login).data.accessToken;

    const revoke = await request(server)
      .delete(`/v1/auth/sessions/${remainingSessionId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(revoke.status).toBe(404);
    expect(err(revoke).error.code).toBe('SESSION_NOT_FOUND');
  });

  it('enforces per-route permissions: INVENTORY_VIEW passes, USERS_MANAGE is forbidden for a Warehouse-role admin', async () => {
    const warehouseRole = await prisma.role.findFirstOrThrow({ where: { key: 'WAREHOUSE' } });
    const admin = await createTestAdmin(prisma, warehouseRole.id, 'warehouse-permissions');
    warehouseAdminId = admin.id;

    const login = await request(server)
      .post('/v1/auth/login')
      .send({ email: admin.email, password: TEST_ADMIN_PASSWORD });
    const accessToken = ok<{ accessToken: string }>(login).data.accessToken;

    const allowedRoute = await request(server)
      .get('/v1/inventory/warehouses')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(allowedRoute.status).toBe(200);

    const forbiddenRoute = await request(server)
      .get('/v1/identity/admin-users')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(forbiddenRoute.status).toBe(403);
    expect(err(forbiddenRoute).error.code).toBe('FORBIDDEN');
  });
});
