import { LogoutUseCase } from './logout.use-case';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import type { TokenService } from '../../domain/services/token.service';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';

function buildStoredToken(revoked = false): RefreshToken {
  return RefreshToken.reconstitute({
    id: 'rt-1',
    jti: 'jti-1',
    familyId: 'family-1',
    adminUserId: 'user-1',
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: revoked ? new Date() : null,
    replacedByJti: null,
    userAgent: null,
    ipAddress: null,
  });
}

describe('LogoutUseCase', () => {
  let refreshTokens: jest.Mocked<RefreshTokenRepository>;
  let tokens: jest.Mocked<TokenService>;
  let useCase: LogoutUseCase;

  beforeEach(() => {
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
    useCase = new LogoutUseCase(refreshTokens, tokens);
  });

  it('revokes the session behind a valid, active refresh token', async () => {
    tokens.verifyRefreshToken.mockResolvedValue({
      sub: 'user-1',
      jti: 'jti-1',
      familyId: 'family-1',
      type: 'refresh',
    });
    const stored = buildStoredToken();
    refreshTokens.findByJti.mockResolvedValue(stored);

    await useCase.execute({ refreshToken: 'some.jwt.token' });

    expect(refreshTokens.save).toHaveBeenCalledWith(stored);
    expect(stored.isRevoked()).toBe(true);
  });

  it('is a no-op when the token fails verification (idempotent logout)', async () => {
    tokens.verifyRefreshToken.mockRejectedValue(new Error('invalid'));

    await expect(useCase.execute({ refreshToken: 'garbage' })).resolves.toBeUndefined();
    expect(refreshTokens.save).not.toHaveBeenCalled();
  });

  it('is a no-op when the token is unknown', async () => {
    tokens.verifyRefreshToken.mockResolvedValue({
      sub: 'user-1',
      jti: 'jti-1',
      familyId: 'family-1',
      type: 'refresh',
    });
    refreshTokens.findByJti.mockResolvedValue(null);

    await expect(useCase.execute({ refreshToken: 'some.jwt.token' })).resolves.toBeUndefined();
    expect(refreshTokens.save).not.toHaveBeenCalled();
  });

  it('is a no-op when the token was already revoked', async () => {
    tokens.verifyRefreshToken.mockResolvedValue({
      sub: 'user-1',
      jti: 'jti-1',
      familyId: 'family-1',
      type: 'refresh',
    });
    refreshTokens.findByJti.mockResolvedValue(buildStoredToken(true));

    await useCase.execute({ refreshToken: 'some.jwt.token' });
    expect(refreshTokens.save).not.toHaveBeenCalled();
  });
});
