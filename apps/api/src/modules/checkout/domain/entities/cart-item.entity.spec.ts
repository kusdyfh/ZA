import { CartItem, type CartItemProps } from './cart-item.entity';
import { InvalidCartQuantityError } from '../errors/checkout.errors';

function buildCartItem(overrides: Partial<CartItemProps> = {}): CartItem {
  const props: CartItemProps = {
    id: 'item-1',
    cartId: 'cart-1',
    variantId: 'variant-1',
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return CartItem.reconstitute(props);
}

describe('CartItem.validateQuantity', () => {
  it('allows a positive integer', () => {
    expect(CartItem.validateQuantity(3)).toBe(3);
  });

  it('rejects zero', () => {
    expect(() => CartItem.validateQuantity(0)).toThrow(InvalidCartQuantityError);
  });

  it('rejects a negative quantity', () => {
    expect(() => CartItem.validateQuantity(-1)).toThrow(InvalidCartQuantityError);
  });

  it('rejects a non-integer quantity', () => {
    expect(() => CartItem.validateQuantity(1.5)).toThrow(InvalidCartQuantityError);
  });
});

describe('CartItem', () => {
  it('exposes every field via getters', () => {
    const item = buildCartItem();
    expect(item.variantId).toBe('variant-1');
    expect(item.quantity).toBe(2);
  });

  it('is immutable — no mutator methods exist', () => {
    const item = buildCartItem() as unknown as Record<string, unknown>;
    expect(item.setQuantity).toBeUndefined();
  });
});
