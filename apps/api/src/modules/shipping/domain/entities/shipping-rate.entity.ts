export interface ShippingRateProps {
  id: string;
  storeId: string;
  zoneId: string;
  methodId: string;
  fee: number;
  freeShippingThreshold: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** The join of exactly one zone and one method (ADR 0027). */
export class ShippingRate {
  private constructor(private readonly props: ShippingRateProps) {}

  static reconstitute(props: ShippingRateProps): ShippingRate {
    return new ShippingRate(props);
  }

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get zoneId(): string {
    return this.props.zoneId;
  }

  get methodId(): string {
    return this.props.methodId;
  }

  get fee(): number {
    return this.props.fee;
  }

  get freeShippingThreshold(): number | null {
    return this.props.freeShippingThreshold;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /** Evaluated against (subtotal - discountTotal), per docs/product/11-SHIPPING.md. */
  computeFee(netSubtotal: number): number {
    if (this.props.freeShippingThreshold !== null && netSubtotal >= this.props.freeShippingThreshold) {
      return 0;
    }
    return this.props.fee;
  }

  toProps(): ShippingRateProps {
    return { ...this.props };
  }
}
