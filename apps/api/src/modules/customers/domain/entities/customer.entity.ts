import type { Email } from '../value-objects/email.vo';

export interface CustomerProps {
  id: string;
  storeId: string;
  email: Email;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  marketingOptIn: boolean;
  cartToken: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The storefront customer — credentials and profile unified per
 * docs/v2/adr/0018 §1. New instances are produced by the repository
 * (`create`), never a public constructor — same discipline as
 * Identity's `AdminUser`. `cartToken` is generated once at creation and
 * never changes (ADR 0018 §3).
 */
export class Customer {
  private constructor(private props: CustomerProps) {}

  static reconstitute(props: CustomerProps): Customer {
    return new Customer(props);
  }

  updateProfile(input: {
    firstName: string;
    lastName: string;
    phone: string | null;
    marketingOptIn: boolean;
  }): void {
    this.props.firstName = input.firstName;
    this.props.lastName = input.lastName;
    this.props.phone = input.phone;
    this.props.marketingOptIn = input.marketingOptIn;
    this.props.updatedAt = new Date();
  }

  changePassword(newPasswordHash: string): void {
    this.props.passwordHash = newPasswordHash;
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get marketingOptIn(): boolean {
    return this.props.marketingOptIn;
  }

  get cartToken(): string {
    return this.props.cartToken;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toProps(): CustomerProps {
    return { ...this.props };
  }
}
