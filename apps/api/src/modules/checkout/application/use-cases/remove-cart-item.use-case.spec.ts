import { RemoveCartItemUseCase } from './remove-cart-item.use-case';
import type { CartRepository } from '../../domain/repositories/cart.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Cart } from '../../domain/entities/cart.entity';
import { CartNotFoundError } from '../../domain/errors/checkout.errors';

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

describe('RemoveCartItemUseCase', () => {
  let carts: jest.Mocked<CartRepository>;
  let storeContext: StoreContext;
  let useCase: RemoveCartItemUseCase;

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
    useCase = new RemoveCartItemUseCase(carts, storeContext);
  });

  it('removes an item from the cart', async () => {
    carts.findByToken.mockResolvedValue(buildCart());
    carts.removeItem.mockResolvedValue(buildCart());

    await useCase.execute({ guestToken: 'guest-token-abc', variantId: 'variant-1' });

    expect(carts.removeItem).toHaveBeenCalledWith('cart-1', 'variant-1');
  });

  it('throws CartNotFoundError when the cart does not exist', async () => {
    carts.findByToken.mockResolvedValue(null);

    await expect(
      useCase.execute({ guestToken: 'missing-token', variantId: 'variant-1' }),
    ).rejects.toThrow(CartNotFoundError);
  });
});
