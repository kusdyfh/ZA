export interface ShippingMethodProps {
  id: string;
  storeId: string;
  name: string;
  minDays: number;
  maxDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** minDays/maxDays back a "3-5 business days" range display — never an exact calendar date (docs/product/11-SHIPPING.md). */
export class ShippingMethod {
  private constructor(private readonly props: ShippingMethodProps) {}

  static reconstitute(props: ShippingMethodProps): ShippingMethod {
    return new ShippingMethod(props);
  }

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get name(): string {
    return this.props.name;
  }

  get minDays(): number {
    return this.props.minDays;
  }

  get maxDays(): number {
    return this.props.maxDays;
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

  toProps(): ShippingMethodProps {
    return { ...this.props };
  }
}
