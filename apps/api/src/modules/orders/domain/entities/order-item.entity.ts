export interface OrderItemProps {
  id: string;
  variantId: string | null;
  stockReservationId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

/**
 * A permanent snapshot line — per docs/v2/adr/0004/0015, display never
 * depends on `variantId` still resolving to a live row. Immutable: once
 * an Order is created, its items never change (see Order's own doc
 * comment).
 */
export class OrderItem {
  private constructor(private readonly props: OrderItemProps) {}

  static reconstitute(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }

  get id(): string {
    return this.props.id;
  }

  get variantId(): string | null {
    return this.props.variantId;
  }

  get stockReservationId(): string {
    return this.props.stockReservationId;
  }

  get productNameSnapshot(): string {
    return this.props.productNameSnapshot;
  }

  get skuSnapshot(): string {
    return this.props.skuSnapshot;
  }

  get unitPrice(): number {
    return this.props.unitPrice;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get lineTotal(): number {
    return this.props.lineTotal;
  }

  toProps(): OrderItemProps {
    return { ...this.props };
  }
}
