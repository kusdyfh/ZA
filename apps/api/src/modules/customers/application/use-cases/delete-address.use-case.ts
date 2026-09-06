import { Inject, Injectable } from '@nestjs/common';
import { AddressNotFoundError } from '../../domain/errors/customer.errors';
import {
  CUSTOMER_ADDRESS_REPOSITORY,
  type CustomerAddressRepository,
} from '../../domain/repositories/customer-address.repository';

export interface DeleteAddressInput {
  addressId: string;
  customerId: string;
}

/** Deleting the only (even default) address is fine — docs/product/02-CUSTOMERS.md's explicit edge case. */
@Injectable()
export class DeleteAddressUseCase {
  constructor(
    @Inject(CUSTOMER_ADDRESS_REPOSITORY) private readonly addresses: CustomerAddressRepository,
  ) {}

  async execute(input: DeleteAddressInput): Promise<void> {
    const existing = await this.addresses.findById(input.addressId);
    if (!existing || existing.customerId !== input.customerId) {
      throw new AddressNotFoundError(input.addressId);
    }
    await this.addresses.delete(input.addressId);
  }
}
