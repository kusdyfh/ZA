import { MergeGuestCartUseCase } from './merge-guest-cart.use-case';
import type { CartRepository } from '../../../checkout/domain/repositories/cart.repository';
import type { CustomerRepository } from '../../domain/repositories/customer.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Customer } from '../../domain/entities/customer.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Cart } from '../../../checkout/domain/entities/cart.entity';

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
    cartToken: 'customer-cart-token',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildCart(guestToken: string, items: Array<{ variantId: string; quantity: number }>): Cart {
  return Cart.reconstitute({
    id: `cart-${guestToken}`,
    storeId: 'store-1',
    guestToken,
    items: items.map((item, index) => ({
      id: `item-${index}`,
      cartId: `cart-${guestToken}`,
      variantId: item.variantId,
      quantity: item.quantity,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('MergeGuestCartUseCase', () => {
  let carts: jest.Mocked<CartRepository>;
  let customers: jest.Mocked<CustomerRepository>;
  let storeContext: StoreContext;
  let useCase: MergeGuestCartUseCase;

  beforeEach(() => {
    carts = {
      findOrCreateByToken: jest.fn(),
      findByToken: jest.fn(),
      addItem: jest.fn(),
      setItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    customers = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    };
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    useCase = new MergeGuestCartUseCase(carts, customers, storeContext);
  });

  it('moves guest items into the customer cart and clears the guest cart', async () => {
    customers.findById.mockResolvedValue(buildCustomer());
    const guestCart = buildCart('guest-token-1', [{ variantId: 'variant-1', quantity: 2 }]);
    const customerCart = buildCart('customer-cart-token', []);
    carts.findOrCreateByToken.mockResolvedValueOnce(guestCart).mockResolvedValueOnce(customerCart);

    await useCase.execute({ customerId: 'customer-1', guestToken: 'guest-token-1' });

    expect(carts.addItem).toHaveBeenCalledWith(customerCart.id, 'variant-1', 2);
    expect(carts.clear).toHaveBeenCalledWith(guestCart.id);
  });

  it('is a no-op when the guestToken is already the customer\'s own cartToken', async () => {
    customers.findById.mockResolvedValue(buildCustomer());

    await useCase.execute({ customerId: 'customer-1', guestToken: 'customer-cart-token' });

    expect(carts.findOrCreateByToken).not.toHaveBeenCalled();
  });

  it('is a no-op when the guest cart is empty', async () => {
    customers.findById.mockResolvedValue(buildCustomer());
    carts.findOrCreateByToken.mockResolvedValue(buildCart('guest-token-1', []));

    await useCase.execute({ customerId: 'customer-1', guestToken: 'guest-token-1' });

    expect(carts.addItem).not.toHaveBeenCalled();
    expect(carts.clear).not.toHaveBeenCalled();
  });
});
