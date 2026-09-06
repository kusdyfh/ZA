import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CustomerAddress } from '../../domain/entities/customer-address.entity';
import type {
  CreateAddressData,
  CustomerAddressRepository,
  UpdateAddressData,
} from '../../domain/repositories/customer-address.repository';
import { AddressNotFoundError } from '../../domain/errors/customer.errors';
import { CustomerAddressMapper } from '../mappers/customer-address.mapper';

@Injectable()
export class PrismaCustomerAddressRepository implements CustomerAddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAddressData): Promise<CustomerAddress> {
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.customerAddress.updateMany({
          where: { customerId: data.customerId },
          data: { isDefault: false },
        });
      }
      const record = await tx.customerAddress.create({
        data: {
          customerId: data.customerId,
          fullName: data.fullName,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2,
          city: data.city,
          governorate: data.governorate,
          country: data.country,
          isDefault: data.isDefault,
        },
      });
      return CustomerAddressMapper.toDomain(record);
    });
  }

  async findById(id: string): Promise<CustomerAddress | null> {
    const record = await this.prisma.customerAddress.findUnique({ where: { id } });
    return record ? CustomerAddressMapper.toDomain(record) : null;
  }

  /** Un-defaults every other address for the same customer first when `isDefault` is true — "exactly one default" (ADR 0018). */
  async update(id: string, data: UpdateAddressData): Promise<CustomerAddress> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.customerAddress.findUnique({ where: { id } });
      if (!existing) {
        throw new AddressNotFoundError(id);
      }
      if (data.isDefault) {
        await tx.customerAddress.updateMany({
          where: { customerId: existing.customerId, id: { not: id } },
          data: { isDefault: false },
        });
      }
      const record = await tx.customerAddress.update({
        where: { id },
        data: {
          fullName: data.fullName,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2,
          city: data.city,
          governorate: data.governorate,
          country: data.country,
          isDefault: data.isDefault,
        },
      });
      return CustomerAddressMapper.toDomain(record);
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.customerAddress.deleteMany({ where: { id } });
  }

  async listByCustomerId(customerId: string): Promise<CustomerAddress[]> {
    const records = await this.prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return records.map(CustomerAddressMapper.toDomain);
  }
}
