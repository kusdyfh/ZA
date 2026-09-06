import { Inject, Injectable } from '@nestjs/common';
import type { Customer } from '../../domain/entities/customer.entity';
import { CustomerPolicy } from '../../domain/policies/customer-policy';
import { CustomerNotFoundError } from '../../domain/errors/customer.errors';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
} from '../../domain/repositories/customer.repository';

export interface UpdateCustomerProfileInput {
  customerId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  marketingOptIn: boolean;
}

/** Self-service only (docs/product/02-CUSTOMERS.md) — no staff role edits a customer's profile on their behalf in v1. */
@Injectable()
export class UpdateCustomerProfileUseCase {
  constructor(@Inject(CUSTOMER_REPOSITORY) private readonly customers: CustomerRepository) {}

  async execute(input: UpdateCustomerProfileInput): Promise<Customer> {
    const customer = await this.customers.findById(input.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(input.customerId);
    }

    const firstName = CustomerPolicy.validateName(input.firstName);
    const lastName = CustomerPolicy.validateName(input.lastName);

    customer.updateProfile({
      firstName,
      lastName,
      phone: input.phone ?? null,
      marketingOptIn: input.marketingOptIn,
    });
    await this.customers.save(customer);
    return customer;
  }
}
