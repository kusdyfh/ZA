import { InvalidCartQuantityError } from '../errors/checkout.errors';

export interface CartItemProps {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A live, pre-purchase line item — unlike `OrderItem`, this is never a
 * snapshot (prices/names are resolved live for display, since the cart
 * isn't a historical record). Immutable from the outside: the only way
 * quantity ever changes is `CartRepository.setItemQuantity()`, mirroring
 * Inventory's "repository is the sole mutator" discipline.
 */
export class CartItem {
  private constructor(private readonly props: CartItemProps) {}

  static reconstitute(props: CartItemProps): CartItem {
    return new CartItem(props);
  }

  static validateQuantity(quantity: number): number {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InvalidCartQuantityError();
    }
    return quantity;
  }

  get id(): string {
    return this.props.id;
  }

  get cartId(): string {
    return this.props.cartId;
  }

  get variantId(): string {
    return this.props.variantId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toProps(): CartItemProps {
    return { ...this.props };
  }
}
