import { RefreshToken, type RefreshTokenProps } from './refresh-token.entity';

function buildToken(overrides: Partial<RefreshTokenProps> = {}): RefreshToken {
  const props: RefreshTokenProps = {
    id: 'rt-1',
    jti: 'jti-1',
    familyId: 'family-1',
    adminUserId: 'user-1',
    issuedAt: new Date('2026-01-01T00:00:00Z'),
    expiresAt: new Date('2026-01-08T00:00:00Z'),
    revokedAt: null,
    replacedByJti: null,
    userAgent: 'jest',
    ipAddress: '127.0.0.1',
    ...overrides,
  };
  return RefreshToken.reconstitute(props);
}

describe('RefreshToken', () => {
  it('is active when not revoked and not expired', () => {
    const token = buildToken({ expiresAt: new Date(Date.now() + 60_000) });
    expect(token.isActive()).toBe(true);
  });

  it('is not active once expired', () => {
    const token = buildToken({ expiresAt: new Date(Date.now() - 1) });
    expect(token.isExpired()).toBe(true);
    expect(token.isActive()).toBe(false);
  });

  it('is not active once revoked, even if not yet expired', () => {
    const token = buildToken({
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
    });
    expect(token.isRevoked()).toBe(true);
    expect(token.isActive()).toBe(false);
  });

  it('revoke() sets revokedAt and, when rotating, records replacedByJti', () => {
    const token = buildToken();
    expect(token.isRevoked()).toBe(false);

    token.revoke('new-jti');

    expect(token.isRevoked()).toBe(true);
    expect(token.toProps().replacedByJti).toBe('new-jti');
  });

  it('revoke() without a replacement jti still revokes (logout/password-change case)', () => {
    const token = buildToken();
    token.revoke();
    expect(token.isRevoked()).toBe(true);
    expect(token.toProps().replacedByJti).toBeNull();
  });
});
