import { ActorType } from '@za/types';
import { RefreshAccessTokenUseCase } from './refresh-access-token.use-case';
import type { AdminUserRepository } from '../../../identity/domain/repositories/admin-user.repository';
import { AdminUser } from '../../../identity/domain/entities/admin-user.entity';
import { Email } from '../../../identity/domain/value-objects/email.vo';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import type { TokenService } from '../../domain/services/token.service';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { InvalidRefreshTokenError, RefreshTokenReusedError } from '../../domain/errors/auth.errors';

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

function buildStoredToken(overrides: Partial<{ revoked: boolean; expired: boolean }> = {}): RefreshToken {
  return RefreshToken.reconstitute({
    id: 'rt-1',
    jti: 'jti-1',
    familyId: 'family-1',
    adminUserId: 'user-1',
    issuedAt: new Date(),
    expiresAt: overrides.expired ? new Date(Date.now() - 1) : new Date(Date.now() + 60_000),
    revokedAt: overrides.revoked ? new Date() : null,
    replacedByJti: null,
    userAgent: null,
    ipAddress: null,
  });
}

describe('RefreshAccessTokenUseCase', () => {
  let adminUsers: jest.Mocked<AdminUserRepository>;
  let refreshTokens: jest.Mocked<RefreshTokenRepository>;
  let tokens: jest.Mocked<TokenService>;
  let useCase: RefreshAccessTokenUseCase;

  const input = { refreshToken: 'some.jwt.token', userAgent: 'jest', ipAddress: '127.0.0.1' };

  beforeEach(() => {
    adminUsers = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      countActiveByRoleId: jest.fn(),
      list: jest.fn(),
    };
    refreshTokens = {
      create: jest.fn(),
      findByJti: jest.fn(),
      save: jest.fn(),
      listActiveByAdminUserId: jest.fn(),
      revokeFamily: jest.fn(),
      revokeAllForAdminUser: jest.fn(),
    };
    tokens = {
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };
    useCase = new RefreshAccessTokenUseCase(adminUsers, refreshTokens, tokens);

    tokens.verifyRefreshToken.mockResolvedValue({
      sub: 'user-1',
      jti: 'jti-1',
      familyId: 'family-1',
      type: 'refresh',
    });
  });

  it('rotates the token: revokes the old one and issues a new one in the same family', async () => {
    const stored = buildStoredToken();
    refreshTokens.findByJti.mockResolvedValue(stored);
    adminUsers.findById.mockResolvedValue(buildUser());
    tokens.signAccessToken.mockResolvedValue('new-access');
    tokens.signRefreshToken.mockResolvedValue('new-refresh');

    const result = await useCase.execute(input);

    expect(result).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    expect(stored.isRevoked()).toBe(true);
    expect(refreshTokens.save).toHaveBeenCalledWith(stored);
    expect(refreshTokens.create).toHaveBeenCalledWith(
      expect.objectContaining({ familyId: 'family-1', adminUserId: 'user-1' }),
    );
    expect(refreshTokens.revokeFamily).not.toHaveBeenCalled();
  });

  it('detects reuse of an already-revoked token and revokes the whole family', async () => {
    refreshTokens.findByJti.mockResolvedValue(buildStoredToken({ revoked: true }));

    await expect(useCase.execute(input)).rejects.toThrow(RefreshTokenReusedError);
    expect(refreshTokens.revokeFamily).toHaveBeenCalledWith('family-1');
    expect(refreshTokens.create).not.toHaveBeenCalled();
  });

  it('rejects an expired stored token', async () => {
    refreshTokens.findByJti.mockResolvedValue(buildStoredToken({ expired: true }));

    await expect(useCase.execute(input)).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('rejects when the JWT itself fails verification', async () => {
    tokens.verifyRefreshToken.mockRejectedValue(new Error('bad signature'));

    await expect(useCase.execute(input)).rejects.toThrow(InvalidRefreshTokenError);
    expect(refreshTokens.findByJti).not.toHaveBeenCalled();
  });

  it('rejects when the jti is unknown', async () => {
    refreshTokens.findByJti.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('rejects when the admin account is deactivated since the token was issued', async () => {
    refreshTokens.findByJti.mockResolvedValue(buildStoredToken());
    adminUsers.findById.mockResolvedValue(buildUser(false));

    await expect(useCase.execute(input)).rejects.toThrow(InvalidRefreshTokenError);
  });
});
