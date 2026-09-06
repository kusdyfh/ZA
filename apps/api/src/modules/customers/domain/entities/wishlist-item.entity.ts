export interface WishlistItemProps {
  id: string;
  customerId: string;
  productId: string;
  createdAt: Date;
}

/** Immutable — created or removed, never edited. References Product directly (docs/product/14-WISHLIST.md). */
export class WishlistItem {
  private constructor(private readonly props: WishlistItemProps) {}

  static reconstitute(props: WishlistItemProps): WishlistItem {
    return new WishlistItem(props);
  }

  get id(): string {
    return this.props.id;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get productId(): string {
    return this.props.productId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toProps(): WishlistItemProps {
    return { ...this.props };
  }
}
