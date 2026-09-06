import { Inject, Injectable } from '@nestjs/common';
import type { Customer } from '../../domain/entities/customer.entity';
import { CustomerNotFoundError } from '../../domain/errors/customer.errors';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
} from '../../domain/repositories/customer.repository';

export interface GetCustomerInput {
  customerId: string;
}

/** Shared by the customer's own "my profile" view and staff's support lookup (docs/product/02-CUSTOMERS.md permissions). */
@Injectable()
export class GetCustomerUseCase {
  constructor(@Inject(CUSTOMER_REPOSITORY) private readonly customers: CustomerRepository) {}

  async execute(input: GetCustomerInput): Promise<Customer> {
    const customer = await this.customers.findById(input.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(input.customerId);
    }
    return customer;
  }
}
