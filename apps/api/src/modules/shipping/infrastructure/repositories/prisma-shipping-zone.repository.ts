import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ShippingZone } from '../../domain/entities/shipping-zone.entity';
import type {
  CreateShippingZoneData,
  ShippingZoneRepository,
  UpdateShippingZoneData,
} from '../../domain/repositories/shipping-zone.repository';
import { ShippingZoneNotFoundError } from '../../domain/errors/shipping.errors';
import { ShippingZoneMapper } from '../mappers/shipping-zone.mapper';

@Injectable()
export class PrismaShippingZoneRepository implements ShippingZoneRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateShippingZoneData): Promise<ShippingZone> {
    const record = await this.prisma.shippingZone.create({
      data: { storeId: data.storeId, name: data.name, governorates: data.governorates },
    });
    return ShippingZoneMapper.toDomain(record);
  }

  async update(storeId: string, id: string, data: UpdateShippingZoneData): Promise<ShippingZone> {
    const existing = await this.prisma.shippingZone.findFirst({ where: { id, storeId } });
    if (!existing) {
      throw new ShippingZoneNotFoundError(id);
    }
    const record = await this.prisma.shippingZone.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.governorates !== undefined ? { governorates: data.governorates } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
    return ShippingZoneMapper.toDomain(record);
  }

  async findById(storeId: string, id: string): Promise<ShippingZone | null> {
    const record = await this.prisma.shippingZone.findFirst({ where: { id, storeId } });
    return record ? ShippingZoneMapper.toDomain(record) : null;
  }

  async findByGovernorate(storeId: string, governorate: string): Promise<ShippingZone | null> {
    const record = await this.prisma.shippingZone.findFirst({
      where: { storeId, isActive: true, governorates: { has: governorate } },
    });
    return record ? ShippingZoneMapper.toDomain(record) : null;
  }

  async list(storeId: string): Promise<ShippingZone[]> {
    const records = await this.prisma.shippingZone.findMany({ where: { storeId }, orderBy: { name: 'asc' } });
    return records.map(ShippingZoneMapper.toDomain);
  }
}
