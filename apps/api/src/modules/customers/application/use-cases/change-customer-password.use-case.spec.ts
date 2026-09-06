import { ChangeCustomerPasswordUseCase } from './change-customer-password.use-case';
import type { CustomerRepository } from '../../domain/repositories/customer.repository';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import type { CustomerRefreshTokenRepository } from '../../domain/repositories/customer-refresh-token.repository';
import { Customer } from '../../domain/entities/customer.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { CustomerNotFoundError, InvalidCredentialsError, WeakPasswordError } from '../../domain/errors/customer.errors';

function buildCustomer(): Customer {
  return Customer.reconstitute({
    id: 'customer-1',
    storeId: 'store-1',
    email: Email.create('jane@example.com'),
    passwordHash: 'old-hash',
    firstName: 'Jane',
    lastName: 'Doe',
    phone: null,
    marketingOptIn: false,
    cartToken: 'cart-token-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ChangeCustomerPasswordUseCase', () => {
  let customers: jest.Mocked<CustomerRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let refreshTokens: jest.Mocked<CustomerRefreshTokenRepository>;
  let useCase: ChangeCustomerPasswordUseCase;

  const input = { customerId: 'customer-1', currentPassword: 'old-password', newPassword: 'new-long-password' };

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
    useCase = new ChangeCustomerPasswordUseCase(customers, passwordHasher, refreshTokens);
  });

  it('changes the password and revokes every session', async () => {
    const customer = buildCustomer();
    customers.findById.mockResolvedValue(customer);
    passwordHasher.verify.mockResolvedValue(true);
    passwordHasher.hash.mockResolvedValue('new-hash');

    await useCase.execute(input);

    expect(customer.passwordHash).toBe('new-hash');
    expect(customers.save).toHaveBeenCalledWith(customer);
    expect(refreshTokens.revokeAllForCustomer).toHaveBeenCalledWith('customer-1');
  });

  it('rejects a wrong current password', async () => {
    customers.findById.mockResolvedValue(buildCustomer());
    passwordHasher.verify.mockResolvedValue(false);

    await expect(useCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    expect(customers.save).not.toHaveBeenCalled();
  });

  it('rejects a weak new password', async () => {
    customers.findById.mockResolvedValue(buildCustomer());
    passwordHasher.verify.mockResolvedValue(true);

    await expect(useCase.execute({ ...input, newPassword: 'short' })).rejects.toThrow(WeakPasswordError);
  });

  it('throws CustomerNotFoundError if the customer no longer exists', async () => {
    customers.findById.mockResolvedValue(null);
    await expect(useCase.execute(input)).rejects.toThrow(CustomerNotFoundError);
  });
});
