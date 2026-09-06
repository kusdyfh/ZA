import type { CustomerAddress as CustomerAddressRecord } from '@prisma/client';
import { CustomerAddress } from '../../domain/entities/customer-address.entity';

export class CustomerAddressMapper {
  static toDomain(this: void, record: CustomerAddressRecord): CustomerAddress {
    return CustomerAddress.reconstitute({
      id: record.id,
      customerId: record.customerId,
      fullName: record.fullName,
      phone: record.phone,
      line1: record.line1,
      line2: record.line2,
      city: record.city,
      governorate: record.governorate,
      country: record.country,
      isDefault: record.isDefault,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
