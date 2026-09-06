export interface ShippingZoneProps {
  id: string;
  storeId: string;
  name: string;
  governorates: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Flat, admin-configured regions (docs/product/11-SHIPPING.md) — no geocoding. */
export class ShippingZone {
  private constructor(private readonly props: ShippingZoneProps) {}

  static reconstitute(props: ShippingZoneProps): ShippingZone {
    return new ShippingZone(props);
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

  get governorates(): string[] {
    return [...this.props.governorates];
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

  matches(governorate: string): boolean {
    return this.props.isActive && this.props.governorates.includes(governorate);
  }

  toProps(): ShippingZoneProps {
    return { ...this.props, governorates: [...this.props.governorates] };
  }
}
