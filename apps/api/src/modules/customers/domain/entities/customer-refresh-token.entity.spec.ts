import { CustomerRefreshToken, type CustomerRefreshTokenProps } from './customer-refresh-token.entity';

function buildToken(overrides: Partial<CustomerRefreshTokenProps> = {}): CustomerRefreshToken {
  const props: CustomerRefreshTokenProps = {
    id: 'crt-1',
    jti: 'jti-1',
    familyId: 'family-1',
    customerId: 'customer-1',
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    replacedByJti: null,
    ...overrides,
  };
  return CustomerRefreshToken.reconstitute(props);
}

describe('CustomerRefreshToken', () => {
  it('is active when not revoked and not expired', () => {
    expect(buildToken().isActive()).toBe(true);
  });

  it('is not active once expired', () => {
    const token = buildToken({ expiresAt: new Date(Date.now() - 1) });
    expect(token.isExpired()).toBe(true);
    expect(token.isActive()).toBe(false);
  });

  it('is not active once revoked', () => {
    const token = buildToken({ revokedAt: new Date() });
    expect(token.isRevoked()).toBe(true);
    expect(token.isActive()).toBe(false);
  });

  it('revoke() records replacedByJti when rotating', () => {
    const token = buildToken();
    token.revoke('new-jti');
    expect(token.isRevoked()).toBe(true);
    expect(token.toProps().replacedByJti).toBe('new-jti');
  });
});
