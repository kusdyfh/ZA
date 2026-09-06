import { randomUUID } from 'node:crypto';
import type { Response } from 'supertest';
import type { ApiErrorBody } from '@za/types';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Argon2PasswordHasher } from '../../modules/identity/infrastructure/hashing/argon2-password-hasher';

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export interface ErrorEnvelope {
  success: false;
  error: ApiErrorBody;
}

export function ok<T>(response: Response): SuccessEnvelope<T> {
  return response.body as SuccessEnvelope<T>;
}

export function err(response: Response): ErrorEnvelope {
  return response.body as ErrorEnvelope;
}

export const TEST_ADMIN_PASSWORD = 'IntegrationTest12345';

/**
 * Creates a throwaway AdminUser directly via Prisma (bypassing HTTP) with
 * a real Argon2 hash of `TEST_ADMIN_PASSWORD`, so tests can log in
 * through the real `/v1/auth/login` endpoint without ever touching the
 * seeded bootstrap Super Admin — several Epic 7 tests mutate the
 * password/sessions of whichever account they log in as, and corrupting
 * the seeded bootstrap credentials would break every other manual/e2e
 * workflow that depends on them.
 */
export async function createTestAdmin(
  prisma: PrismaService,
  roleId: string,
  emailPrefix = 'integration-test',
): Promise<{ id: string; email: string }> {
  const hasher = new Argon2PasswordHasher();
  const passwordHash = await hasher.hash(TEST_ADMIN_PASSWORD);
  const email = `${emailPrefix}-${randomUUID()}@example.com`;

  const user = await prisma.adminUser.create({
    data: { name: 'Integration Test Admin', email, passwordHash, roleId },
  });

  return { id: user.id, email };
}

/** Deletes a test admin's refresh tokens / reset tokens (FK RESTRICT) before the row itself. */
export async function deleteTestAdmin(prisma: PrismaService, adminUserId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { adminUserId } });
  await prisma.passwordResetToken.deleteMany({ where: { adminUserId } });
  await prisma.loginHistory.deleteMany({ where: { adminUserId } });
  await prisma.adminUser.deleteMany({ where: { id: adminUserId } });
}
