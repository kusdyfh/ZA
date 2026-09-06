import { RevokeSessionUseCase } from './revoke-session.use-case';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { SessionNotFoundError } from '../../domain/errors/auth.errors';

function buildSession(id: string, adminUserId: string): RefreshToken {
  return RefreshToken.reconstitute({
    id,
    jti: `jti-${id}`,
    familyId: 'family-1',
    adminUserId,
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    replacedByJti: null,
    userAgent: null,
    ipAddress: null,
  });
}

describe('RevokeSessionUseCase', () => {
  let refreshTokens: jest.Mocked<RefreshTokenRepository>;
  let useCase: RevokeSessionUseCase;

  beforeEach(() => {
    refreshTokens = {
      create: jest.fn(),
      findByJti: jest.fn(),
      save: jest.fn(),
      listActiveByAdminUserId: jest.fn(),
      revokeFamily: jest.fn(),
      revokeAllForAdminUser: jest.fn(),
    };
    useCase = new RevokeSessionUseCase(refreshTokens);
  });

  it('revokes a session belonging to the caller', async () => {
    const session = buildSession('rt-1', 'user-1');
    refreshTokens.listActiveByAdminUserId.mockResolvedValue([session]);

    await useCase.execute({ adminUserId: 'user-1', sessionId: 'rt-1' });

    expect(session.isRevoked()).toBe(true);
    expect(refreshTokens.save).toHaveBeenCalledWith(session);
  });

  it('throws SessionNotFoundError for a session id that does not belong to the caller', async () => {
    refreshTokens.listActiveByAdminUserId.mockResolvedValue([buildSession('rt-1', 'user-1')]);

    await expect(
      useCase.execute({ adminUserId: 'user-1', sessionId: 'someone-elses-session' }),
    ).rejects.toThrow(SessionNotFoundError);
    expect(refreshTokens.save).not.toHaveBeenCalled();
  });
});
