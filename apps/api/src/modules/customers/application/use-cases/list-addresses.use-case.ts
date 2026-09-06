import { Inject, Injectable } from '@nestjs/common';
import type { CustomerAddress } from '../../domain/entities/customer-address.entity';
import {
  CUSTOMER_ADDRESS_REPOSITORY,
  type CustomerAddressRepository,
} from '../../domain/repositories/customer-address.repository';

export interface ListAddressesInput {
  customerId: string;
}

@Injectable()
export class ListAddressesUseCase {
  constructor(
    @Inject(CUSTOMER_ADDRESS_REPOSITORY) private readonly addresses: CustomerAddressRepository,
  ) {}

  async execute(input: ListAddressesInput): Promise<CustomerAddress[]> {
    return this.addresses.listByCustomerId(input.customerId);
  }
}
