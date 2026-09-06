import { Cart, type CartProps } from './cart.entity';

function buildCart(overrides: Partial<CartProps> = {}): Cart {
  const props: CartProps = {
    id: 'cart-1',
    storeId: 'store-1',
    guestToken: 'guest-token-abc',
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return Cart.reconstitute(props);
}

describe('Cart', () => {
  it('reports isEmpty correctly for a cart with no items', () => {
    const cart = buildCart();
    expect(cart.isEmpty).toBe(true);
  });

  it('reports isEmpty correctly for a cart with items', () => {
    const cart = buildCart({
      items: [
        {
          id: 'item-1',
          cartId: 'cart-1',
          variantId: 'variant-1',
          quantity: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
    expect(cart.isEmpty).toBe(false);
    expect(cart.items).toHaveLength(1);
  });

  it('is immutable — no mutator methods exist', () => {
    const cart = buildCart() as unknown as Record<string, unknown>;
    expect(cart.addItem).toBeUndefined();
    expect(cart.removeItem).toBeUndefined();
  });
});
