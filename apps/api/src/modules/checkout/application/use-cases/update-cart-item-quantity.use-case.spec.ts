import { UpdateCartItemQuantityUseCase } from './update-cart-item-quantity.use-case';
import type { CartRepository } from '../../domain/repositories/cart.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Cart } from '../../domain/entities/cart.entity';
import { CartNotFoundError, InvalidCartQuantityError } from '../../domain/errors/checkout.errors';

function buildCart(): Cart {
  return Cart.reconstitute({
    id: 'cart-1',
    storeId: 'store-1',
    guestToken: 'guest-token-abc',
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('UpdateCartItemQuantityUseCase', () => {
  let carts: jest.Mocked<CartRepository>;
  let storeContext: StoreContext;
  let useCase: UpdateCartItemQuantityUseCase;

  beforeEach(() => {
    carts = {
      findOrCreateByToken: jest.fn(),
      findByToken: jest.fn(),
      addItem: jest.fn(),
      setItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    useCase = new UpdateCartItemQuantityUseCase(carts, storeContext);
  });

  it('sets an absolute quantity', async () => {
    carts.findByToken.mockResolvedValue(buildCart());
    carts.setItemQuantity.mockResolvedValue(buildCart());

    await useCase.execute({ guestToken: 'guest-token-abc', variantId: 'variant-1', quantity: 5 });

    expect(carts.setItemQuantity).toHaveBeenCalledWith('cart-1', 'variant-1', 5);
  });

  it('throws CartNotFoundError when the cart does not exist', async () => {
    carts.findByToken.mockResolvedValue(null);

    await expect(
      useCase.execute({ guestToken: 'missing-token', variantId: 'variant-1', quantity: 5 }),
    ).rejects.toThrow(CartNotFoundError);
  });

  it('rejects a non-positive quantity', async () => {
    await expect(
      useCase.execute({ guestToken: 'guest-token-abc', variantId: 'variant-1', quantity: 0 }),
    ).rejects.toThrow(InvalidCartQuantityError);
    expect(carts.findByToken).not.toHaveBeenCalled();
  });
});
