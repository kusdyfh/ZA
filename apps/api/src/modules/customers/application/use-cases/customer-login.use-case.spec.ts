import { CustomerLoginUseCase } from './customer-login.use-case';
import type { CustomerRepository } from '../../domain/repositories/customer.repository';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import type { CustomerRefreshTokenRepository } from '../../domain/repositories/customer-refresh-token.repository';
import type { CustomerTokenService } from '../../domain/services/customer-token.service';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import type { MergeGuestCartUseCase } from './merge-guest-cart.use-case';
import type { AssociateGuestOrdersUseCase } from './associate-guest-orders.use-case';
import { Customer } from '../../domain/entities/customer.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { InvalidCredentialsError } from '../../domain/errors/customer.errors';

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

describe('CustomerLoginUseCase', () => {
  let customers: jest.Mocked<CustomerRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let refreshTokens: jest.Mocked<CustomerRefreshTokenRepository>;
  let tokens: jest.Mocked<CustomerTokenService>;
  let storeContext: StoreContext;
  let mergeGuestCart: jest.Mocked<MergeGuestCartUseCase>;
  let associateGuestOrders: jest.Mocked<AssociateGuestOrdersUseCase>;
  let useCase: CustomerLoginUseCase;

  const input = { email: 'jane@example.com', password: 'correct-password' };

  beforeEach(() => {
    customers = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    };
    passwordHasher = { hash: jest.fn(), verify: jest.fn() };
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
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    mergeGuestCart = { execute: jest.fn() } as unknown as jest.Mocked<MergeGuestCartUseCase>;
    associateGuestOrders = { execute: jest.fn() } as unknown as jest.Mocked<AssociateGuestOrdersUseCase>;

    useCase = new CustomerLoginUseCase(
      customers,
      passwordHasher,
      refreshTokens,
      tokens,
      storeContext,
      mergeGuestCart,
      associateGuestOrders,
    );
  });

  it('logs in successfully and issues tokens', async () => {
    customers.findByEmail.mockResolvedValue(buildCustomer());
    passwordHasher.verify.mockResolvedValue(true);
    tokens.signAccessToken.mockResolvedValue('access-token');
    tokens.signRefreshToken.mockResolvedValue('refresh-token');

    const result = await useCase.execute(input);

    expect(result.accessToken).toBe('access-token');
    expect(result.customer.id).toBe('customer-1');
    expect(associateGuestOrders.execute).toHaveBeenCalled();
  });

  it('rejects an unknown email with the generic error', async () => {
    customers.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
  });

  it('rejects a wrong password with the generic error', async () => {
    customers.findByEmail.mockResolvedValue(buildCustomer());
    passwordHasher.verify.mockResolvedValue(false);

    await expect(useCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
  });

  it('merges the guest cart when a guestToken is supplied', async () => {
    customers.findByEmail.mockResolvedValue(buildCustomer());
    passwordHasher.verify.mockResolvedValue(true);
    tokens.signAccessToken.mockResolvedValue('access-token');
    tokens.signRefreshToken.mockResolvedValue('refresh-token');

    await useCase.execute({ ...input, guestToken: 'guest-token-1' });

    expect(mergeGuestCart.execute).toHaveBeenCalledWith({
      customerId: 'customer-1',
      guestToken: 'guest-token-1',
    });
  });
});
