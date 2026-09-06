import { ActorType } from '@za/types';
import { LoginUseCase } from './login.use-case';
import type { AdminUserRepository } from '../../../identity/domain/repositories/admin-user.repository';
import type { PasswordHasher } from '../../../identity/domain/services/password-hasher';
import { AdminUser } from '../../../identity/domain/entities/admin-user.entity';
import { Email } from '../../../identity/domain/value-objects/email.vo';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import type { LoginHistoryRepository } from '../../domain/repositories/login-history.repository';
import type { TokenService } from '../../domain/services/token.service';
import { InvalidCredentialsError } from '../../domain/errors/auth.errors';

function buildUser(isActive = true): AdminUser {
  return AdminUser.reconstitute({
    id: 'user-1',
    name: 'Jane Doe',
    email: Email.create('jane@example.com'),
    passwordHash: 'hashed',
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

describe('LoginUseCase', () => {
  let adminUsers: jest.Mocked<AdminUserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let refreshTokens: jest.Mocked<RefreshTokenRepository>;
  let loginHistory: jest.Mocked<LoginHistoryRepository>;
  let tokens: jest.Mocked<TokenService>;
  let useCase: LoginUseCase;

  const input = {
    email: 'jane@example.com',
    password: 'correct-password',
    userAgent: 'jest',
    ipAddress: '127.0.0.1',
  };

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
    refreshTokens = {
      create: jest.fn(),
      findByJti: jest.fn(),
      save: jest.fn(),
      listActiveByAdminUserId: jest.fn(),
      revokeFamily: jest.fn(),
      revokeAllForAdminUser: jest.fn(),
    };
    loginHistory = { record: jest.fn(), listByAdminUserId: jest.fn() };
    tokens = {
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };
    useCase = new LoginUseCase(adminUsers, passwordHasher, refreshTokens, loginHistory, tokens);
  });

  it('logs in successfully, issues tokens, and records a successful attempt', async () => {
    adminUsers.findByEmail.mockResolvedValue(buildUser());
    passwordHasher.verify.mockResolvedValue(true);
    tokens.signAccessToken.mockResolvedValue('access-token');
    tokens.signRefreshToken.mockResolvedValue('refresh-token');

    const result = await useCase.execute(input);

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.adminUser.id).toBe('user-1');
    expect(refreshTokens.create).toHaveBeenCalledWith(
      expect.objectContaining({ adminUserId: 'user-1' }),
    );
    expect(loginHistory.record).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, adminUserId: 'user-1' }),
    );
  });

  it('rejects an unknown email without revealing that to the caller', async () => {
    adminUsers.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    expect(loginHistory.record).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, adminUserId: null, failureReason: 'UNKNOWN_EMAIL' }),
    );
    expect(refreshTokens.create).not.toHaveBeenCalled();
  });

  it('rejects a wrong password with the same generic error', async () => {
    adminUsers.findByEmail.mockResolvedValue(buildUser());
    passwordHasher.verify.mockResolvedValue(false);

    await expect(useCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    expect(loginHistory.record).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, failureReason: 'INVALID_PASSWORD' }),
    );
  });

  it('rejects an inactive account with the same generic error', async () => {
    adminUsers.findByEmail.mockResolvedValue(buildUser(false));

    await expect(useCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    expect(loginHistory.record).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, failureReason: 'ACCOUNT_INACTIVE' }),
    );
    expect(passwordHasher.verify).not.toHaveBeenCalled();
  });
});
