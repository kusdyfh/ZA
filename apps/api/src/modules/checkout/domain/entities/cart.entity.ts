import { CartItem, type CartItemProps } from './cart-item.entity';

export interface CartProps {
  id: string;
  storeId: string;
  guestToken: string;
  items: CartItemProps[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Guest-only per docs/v2/adr/0015 — identified solely by `guestToken`, no
 * `customerId` yet. Immutable from the outside, same discipline as every
 * other aggregate in this codebase: `CartRepository` is the only place
 * `CartItem` rows are added/changed/removed.
 */
export class Cart {
  private constructor(private readonly props: CartProps) {}

  static reconstitute(props: CartProps): Cart {
    return new Cart(props);
  }

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get guestToken(): string {
    return this.props.guestToken;
  }

  get items(): CartItem[] {
    return this.props.items.map((item) => CartItem.reconstitute(item));
  }

  get isEmpty(): boolean {
    return this.props.items.length === 0;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toProps(): CartProps {
    return { ...this.props };
  }
}
