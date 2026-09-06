import { ActorType } from '@za/types';
import { createHash } from 'node:crypto';
import { ResetPasswordUseCase } from './reset-password.use-case';
import type { AdminUserRepository } from '../../../identity/domain/repositories/admin-user.repository';
import type { PasswordHasher } from '../../../identity/domain/services/password-hasher';
import { AdminUser } from '../../../identity/domain/entities/admin-user.entity';
import { Email } from '../../../identity/domain/value-objects/email.vo';
import type { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';
import { InvalidPasswordResetTokenError } from '../../domain/errors/auth.errors';

const rawToken = 'raw-reset-token';
const tokenHash = createHash('sha256').update(rawToken).digest('hex');

function buildUser(isActive = true): AdminUser {
  return AdminUser.reconstitute({
    id: 'user-1',
    name: 'Jane Doe',
    email: Email.create('jane@example.com'),
    passwordHash: 'old-hash',
    roleId: 'role-1',
    isActive,
    deactivatedAt: null,
    createdByActorId: null,
    createdByActorType: ActorType.SYSTEM,
    updatedByActorId: null,
    updatedByActorType: ActorType.SYSTEM,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildResetToken(overrides: Partial<{ used: boolean; expired: boolean }> = {}): PasswordResetToken {
  return PasswordResetToken.reconstitute({
    id: 'prt-1',
    tokenHash,
    adminUserId: 'user-1',
    expiresAt: overrides.expired ? new Date(Date.now() - 1) : new Date(Date.now() + 60_000),
    usedAt: overrides.used ? new Date() : null,
    createdAt: new Date(),
  });
}

describe('ResetPasswordUseCase', () => {
  let adminUsers: jest.Mocked<AdminUserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let passwordResetTokens: jest.Mocked<PasswordResetTokenRepository>;
  let refreshTokens: jest.Mocked<RefreshTokenRepository>;
  let useCase: ResetPasswordUseCase;

  const input = { token: rawToken, newPassword: 'new-long-password' };

  beforeEach(() => {
    adminUsers = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      countActiveByRoleId: jest.fn(),
      list: jest.fn(),
    };
    passwordHasher = { hash: jest.fn(), verify: jest.fn() };
    passwordResetTokens = { create: jest.fn(), findByTokenHash: jest.fn(), save: jest.fn() };
    refreshTokens = {
      create: jest.fn(),
      findByJti: jest.fn(),
      save: jest.fn(),
      listActiveByAdminUserId: jest.fn(),
      revokeFamily: jest.fn(),
      revokeAllForAdminUser: jest.fn(),
    };
    useCase = new ResetPasswordUseCase(adminUsers, passwordHasher, passwordResetTokens, refreshTokens);
  });

  it('resets the password, marks the token used, and revokes every session', async () => {
    const resetToken = buildResetToken();
    const user = buildUser();
    passwordResetTokens.findByTokenHash.mockResolvedValue(resetToken);
    adminUsers.findById.mockResolvedValue(user);
    passwordHasher.hash.mockResolvedValue('new-hash');

    await useCase.execute(input);

    expect(passwordResetTokens.findByTokenHash).toHaveBeenCalledWith(tokenHash);
    expect(user.passwordHash).toBe('new-hash');
    expect(adminUsers.save).toHaveBeenCalledWith(user);
    expect(resetToken.isUsed()).toBe(true);
    expect(passwordResetTokens.save).toHaveBeenCalledWith(resetToken);
    expect(refreshTokens.revokeAllForAdminUser).toHaveBeenCalledWith('user-1');
  });

  it('rejects an unknown token', async () => {
    passwordResetTokens.findByTokenHash.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(InvalidPasswordResetTokenError);
  });

  it('rejects an already-used token', async () => {
    passwordResetTokens.findByTokenHash.mockResolvedValue(buildResetToken({ used: true }));

    await expect(useCase.execute(input)).rejects.toThrow(InvalidPasswordResetTokenError);
  });

  it('rejects an expired token', async () => {
    passwordResetTokens.findByTokenHash.mockResolvedValue(buildResetToken({ expired: true }));

    await expect(useCase.execute(input)).rejects.toThrow(InvalidPasswordResetTokenError);
  });

  it('rejects when the admin account no longer exists or is inactive', async () => {
    passwordResetTokens.findByTokenHash.mockResolvedValue(buildResetToken());
    adminUsers.findById.mockResolvedValue(buildUser(false));

    await expect(useCase.execute(input)).rejects.toThrow(InvalidPasswordResetTokenError);
  });
});
