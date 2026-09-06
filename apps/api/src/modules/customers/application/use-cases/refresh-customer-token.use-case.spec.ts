import { RefreshCustomerTokenUseCase } from './refresh-customer-token.use-case';
import type { CustomerRepository } from '../../domain/repositories/customer.repository';
import type { CustomerRefreshTokenRepository } from '../../domain/repositories/customer-refresh-token.repository';
import type { CustomerTokenService } from '../../domain/services/customer-token.service';
import { Customer } from '../../domain/entities/customer.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { CustomerRefreshToken } from '../../domain/entities/customer-refresh-token.entity';
import { InvalidRefreshTokenError, RefreshTokenReusedError } from '../../domain/errors/customer.errors';

function buildCustomer(): Customer {
  return Customer.reconstitute({
    id: 'customer-1',
    storeId: 'store-1',
    email: Email.create('jane@example.com'),
    passwordHash: 'hashed',
    firstName: 'Jane',
    lastName: 'Doe',
    phone: null,
    marketingOptIn: false,
    cartToken: 'cart-token-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildStoredToken(overrides: Partial<{ revoked: boolean; expired: boolean }> = {}): CustomerRefreshToken {
  return CustomerRefreshToken.reconstitute({
    id: 'crt-1',
    jti: 'jti-1',
    familyId: 'family-1',
    customerId: 'customer-1',
    issuedAt: new Date(),
    expiresAt: overrides.expired ? new Date(Date.now() - 1) : new Date(Date.now() + 60_000),
    revokedAt: overrides.revoked ? new Date() : null,
    replacedByJti: null,
  });
}

describe('RefreshCustomerTokenUseCase', () => {
  let customers: jest.Mocked<CustomerRepository>;
  let refreshTokens: jest.Mocked<CustomerRefreshTokenRepository>;
  let tokens: jest.Mocked<CustomerTokenService>;
  let useCase: RefreshCustomerTokenUseCase;

  const input = { refreshToken: 'some.jwt.token' };

  beforeEach(() => {
    customers = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    };
    refreshTokens = {
      create: jest.fn(),
      findByJti: jest.fn(),
      save: jest.fn(),
      revokeFamily: jest.fn(),
      revokeAllForCustomer: jest.fn(),
    };
    tokens = {
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };
    useCase = new RefreshCustomerTokenUseCase(customers, refreshTokens, tokens);

    tokens.verifyRefreshToken.mockResolvedValue({
      sub: 'customer-1',
      jti: 'jti-1',
      familyId: 'family-1',
      type: 'customer-refresh',
    });
  });

  it('rotates the token', async () => {
    const stored = buildStoredToken();
    refreshTokens.findByJti.mockResolvedValue(stored);
    customers.findById.mockResolvedValue(buildCustomer());
    tokens.signAccessToken.mockResolvedValue('new-access');
    tokens.signRefreshToken.mockResolvedValue('new-refresh');

    const result = await useCase.execute(input);

    expect(result).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    expect(stored.isRevoked()).toBe(true);
  });

  it('detects reuse of an already-revoked token and revokes the family', async () => {
    refreshTokens.findByJti.mockResolvedValue(buildStoredToken({ revoked: true }));

    await expect(useCase.execute(input)).rejects.toThrow(RefreshTokenReusedError);
    expect(refreshTokens.revokeFamily).toHaveBeenCalledWith('family-1');
  });

  it('rejects an expired token', async () => {
    refreshTokens.findByJti.mockResolvedValue(buildStoredToken({ expired: true }));
    await expect(useCase.execute(input)).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('rejects when the JWT fails verification', async () => {
    tokens.verifyRefreshToken.mockRejectedValue(new Error('bad signature'));
    await expect(useCase.execute(input)).rejects.toThrow(InvalidRefreshTokenError);
  });
});
