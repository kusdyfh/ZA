import { Inject, Injectable } from '@nestjs/common';
import type { CustomerAddress } from '../../domain/entities/customer-address.entity';
import { CustomerPolicy } from '../../domain/policies/customer-policy';
import { AddressNotFoundError } from '../../domain/errors/customer.errors';
import {
  CUSTOMER_ADDRESS_REPOSITORY,
  type CustomerAddressRepository,
} from '../../domain/repositories/customer-address.repository';

export interface UpdateAddressInput {
  addressId: string;
  customerId: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  governorate: string;
  country: string;
  isDefault?: boolean;
}

/** Ownership is checked here (not just existence) — an address never belongs to more than one customer. */
@Injectable()
export class UpdateAddressUseCase {
  constructor(
    @Inject(CUSTOMER_ADDRESS_REPOSITORY) private readonly addresses: CustomerAddressRepository,
  ) {}

  async execute(input: UpdateAddressInput): Promise<CustomerAddress> {
    const existing = await this.addresses.findById(input.addressId);
    if (!existing || existing.customerId !== input.customerId) {
      throw new AddressNotFoundError(input.addressId);
    }

    CustomerPolicy.assertValidAddress(input);
    return this.addresses.update(input.addressId, {
      fullName: input.fullName,
      phone: input.phone,
      line1: input.line1,
      line2: input.line2 ?? null,
      city: input.city,
      governorate: input.governorate,
      country: input.country,
      isDefault: input.isDefault ?? existing.isDefault,
    });
  }
}
