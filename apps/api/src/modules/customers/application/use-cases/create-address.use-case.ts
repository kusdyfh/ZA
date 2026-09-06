import { Inject, Injectable } from '@nestjs/common';
import type { CustomerAddress } from '../../domain/entities/customer-address.entity';
import { CustomerPolicy } from '../../domain/policies/customer-policy';
import {
  CUSTOMER_ADDRESS_REPOSITORY,
  type CustomerAddressRepository,
} from '../../domain/repositories/customer-address.repository';

export interface CreateAddressInput {
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

@Injectable()
export class CreateAddressUseCase {
  constructor(
    @Inject(CUSTOMER_ADDRESS_REPOSITORY) private readonly addresses: CustomerAddressRepository,
  ) {}

  async execute(input: CreateAddressInput): Promise<CustomerAddress> {
    CustomerPolicy.assertValidAddress(input);
    return this.addresses.create({
      customerId: input.customerId,
      fullName: input.fullName,
      phone: input.phone,
      line1: input.line1,
      line2: input.line2 ?? null,
      city: input.city,
      governorate: input.governorate,
      country: input.country,
      isDefault: input.isDefault ?? false,
    });
  }
}
