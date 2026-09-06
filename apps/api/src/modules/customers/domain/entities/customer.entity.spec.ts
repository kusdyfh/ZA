import { Customer, type CustomerProps } from './customer.entity';
import { Email } from '../value-objects/email.vo';

function buildCustomer(overrides: Partial<CustomerProps> = {}): Customer {
  const props: CustomerProps = {
    id: 'customer-1',
    storeId: 'store-1',
    email: Email.create('jane@example.com'),
    passwordHash: 'old-hash',
    firstName: 'Jane',
    lastName: 'Doe',
    phone: null,
    marketingOptIn: false,
    cartToken: 'cart-token-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
  return Customer.reconstitute(props);
}

describe('Customer#updateProfile', () => {
  it('updates the profile fields', () => {
    const customer = buildCustomer();
    customer.updateProfile({
      firstName: 'Janet',
      lastName: 'Smith',
      phone: '+9647700000000',
      marketingOptIn: true,
    });

    expect(customer.firstName).toBe('Janet');
    expect(customer.lastName).toBe('Smith');
    expect(customer.phone).toBe('+9647700000000');
    expect(customer.marketingOptIn).toBe(true);
  });
});

describe('Customer#changePassword', () => {
  it('updates the passwordHash', () => {
    const customer = buildCustomer({ passwordHash: 'old-hash' });
    customer.changePassword('new-hash');
    expect(customer.passwordHash).toBe('new-hash');
  });
});

describe('Customer getters', () => {
  it('exposes cartToken and email', () => {
    const customer = buildCustomer();
    expect(customer.cartToken).toBe('cart-token-1');
    expect(customer.email.toString()).toBe('jane@example.com');
  });
});
