import { ListSessionsUseCase } from './list-sessions.use-case';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';

describe('ListSessionsUseCase', () => {
  let refreshTokens: jest.Mocked<RefreshTokenRepository>;
  let useCase: ListSessionsUseCase;

  beforeEach(() => {
    refreshTokens = {
      create: jest.fn(),
      findByJti: jest.fn(),
      save: jest.fn(),
      listActiveByAdminUserId: jest.fn(),
      revokeFamily: jest.fn(),
      revokeAllForAdminUser: jest.fn(),
    };
    useCase = new ListSessionsUseCase(refreshTokens);
  });

  it('returns the active sessions for the given admin', async () => {
    const session = RefreshToken.reconstitute({
      id: 'rt-1',
      jti: 'jti-1',
      familyId: 'family-1',
      adminUserId: 'user-1',
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      replacedByJti: null,
      userAgent: null,
      ipAddress: null,
    });
    refreshTokens.listActiveByAdminUserId.mockResolvedValue([session]);

    const result = await useCase.execute({ adminUserId: 'user-1' });

    expect(result).toEqual([session]);
    expect(refreshTokens.listActiveByAdminUserId).toHaveBeenCalledWith(
      'user-1',
      expect.any(Date),
    );
  });
});
