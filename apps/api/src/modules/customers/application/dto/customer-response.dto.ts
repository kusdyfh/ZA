import type { Customer } from '../../domain/entities/customer.entity';

/** Never carries passwordHash. `cartToken` is included so the client knows which token to use for cart calls (ADR 0018 §3). */
export class CustomerResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  phone!: string | null;
  marketingOptIn!: boolean;
  cartToken!: string;
  createdAt!: Date;
  updatedAt!: Date;

  static fromDomain(customer: Customer): CustomerResponseDto {
    const dto = new CustomerResponseDto();
    dto.id = customer.id;
    dto.email = customer.email.toString();
    dto.firstName = customer.firstName;
    dto.lastName = customer.lastName;
    dto.phone = customer.phone;
    dto.marketingOptIn = customer.marketingOptIn;
    dto.cartToken = customer.cartToken;
    dto.createdAt = customer.createdAt;
    dto.updatedAt = customer.updatedAt;
    return dto;
  }
}
