export interface CustomerAddressProps {
  id: string;
  customerId: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  governorate: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A saved address in a customer's address book. Never referenced by
 * Order — editing/deleting an address never touches any past order,
 * since Order always carries its own point-in-time snapshot (ADR 0004).
 * "Exactly one default" is enforced by `CustomerAddressRepository`
 * (transactional un-default-the-rest), not here — this entity only
 * knows about the one row it represents.
 */
export class CustomerAddress {
  private constructor(private props: CustomerAddressProps) {}

  static reconstitute(props: CustomerAddressProps): CustomerAddress {
    return new CustomerAddress(props);
  }

  get id(): string {
    return this.props.id;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get phone(): string {
    return this.props.phone;
  }

  get line1(): string {
    return this.props.line1;
  }

  get line2(): string | null {
    return this.props.line2;
  }

  get city(): string {
    return this.props.city;
  }

  get governorate(): string {
    return this.props.governorate;
  }

  get country(): string {
    return this.props.country;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toProps(): CustomerAddressProps {
    return { ...this.props };
  }
}
