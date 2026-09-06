import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ShippingMethod } from '../../domain/entities/shipping-method.entity';
import type {
  CreateShippingMethodData,
  ShippingMethodRepository,
  UpdateShippingMethodData,
} from '../../domain/repositories/shipping-method.repository';
import { ShippingMethodNotFoundError } from '../../domain/errors/shipping.errors';
import { ShippingMethodMapper } from '../mappers/shipping-method.mapper';

@Injectable()
export class PrismaShippingMethodRepository implements ShippingMethodRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateShippingMethodData): Promise<ShippingMethod> {
    const record = await this.prisma.shippingMethod.create({
      data: { storeId: data.storeId, name: data.name, minDays: data.minDays, maxDays: data.maxDays },
    });
    return ShippingMethodMapper.toDomain(record);
  }

  async update(storeId: string, id: string, data: UpdateShippingMethodData): Promise<ShippingMethod> {
    const existing = await this.prisma.shippingMethod.findFirst({ where: { id, storeId } });
    if (!existing) {
      throw new ShippingMethodNotFoundError(id);
    }
    const record = await this.prisma.shippingMethod.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.minDays !== undefined ? { minDays: data.minDays } : {}),
        ...(data.maxDays !== undefined ? { maxDays: data.maxDays } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
    return ShippingMethodMapper.toDomain(record);
  }

  async findById(storeId: string, id: string): Promise<ShippingMethod | null> {
    const record = await this.prisma.shippingMethod.findFirst({ where: { id, storeId } });
    return record ? ShippingMethodMapper.toDomain(record) : null;
  }

  async list(storeId: string): Promise<ShippingMethod[]> {
    const records = await this.prisma.shippingMethod.findMany({ where: { storeId }, orderBy: { name: 'asc' } });
    return records.map(ShippingMethodMapper.toDomain);
  }
}
