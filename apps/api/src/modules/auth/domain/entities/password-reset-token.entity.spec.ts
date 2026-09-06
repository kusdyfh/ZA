import { PasswordResetToken, type PasswordResetTokenProps } from './password-reset-token.entity';

function buildToken(overrides: Partial<PasswordResetTokenProps> = {}): PasswordResetToken {
  const props: PasswordResetTokenProps = {
    id: 'prt-1',
    tokenHash: 'hash-1',
    adminUserId: 'user-1',
    expiresAt: new Date(Date.now() + 30 * 60_000),
    usedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
  return PasswordResetToken.reconstitute(props);
}

describe('PasswordResetToken', () => {
  it('is valid when not used and not expired', () => {
    const token = buildToken();
    expect(token.isValid()).toBe(true);
  });

  it('is invalid once expired', () => {
    const token = buildToken({ expiresAt: new Date(Date.now() - 1) });
    expect(token.isExpired()).toBe(true);
    expect(token.isValid()).toBe(false);
  });

  it('is invalid once used, even before expiry', () => {
    const token = buildToken({ usedAt: new Date() });
    expect(token.isUsed()).toBe(true);
    expect(token.isValid()).toBe(false);
  });

  it('markUsed() marks it used', () => {
    const token = buildToken();
    expect(token.isUsed()).toBe(false);
    token.markUsed();
    expect(token.isUsed()).toBe(true);
  });
});
