import type { Customer as CustomerRecord } from '@prisma/client';
import { Customer } from '../../domain/entities/customer.entity';
import { Email } from '../../domain/value-objects/email.vo';

export class CustomerMapper {
  static toDomain(this: void, record: CustomerRecord): Customer {
    return Customer.reconstitute({
      id: record.id,
      storeId: record.storeId,
      email: Email.create(record.email),
      passwordHash: record.passwordHash,
      firstName: record.firstName,
      lastName: record.lastName,
      phone: record.phone,
      marketingOptIn: record.marketingOptIn,
      cartToken: record.cartToken,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
