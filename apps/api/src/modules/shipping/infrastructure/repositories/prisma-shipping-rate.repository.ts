import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ShippingRate } from '../../domain/entities/shipping-rate.entity';
import type {
  ShippingRateRepository,
  UpsertShippingRateData,
} from '../../domain/repositories/shipping-rate.repository';
import { ShippingRateMapper } from '../mappers/shipping-rate.mapper';

@Injectable()
export class PrismaShippingRateRepository implements ShippingRateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(data: UpsertShippingRateData): Promise<ShippingRate> {
    const record = await this.prisma.shippingRate.upsert({
      where: { zoneId_methodId: { zoneId: data.zoneId, methodId: data.methodId } },
      create: {
        storeId: data.storeId,
        zoneId: data.zoneId,
        methodId: data.methodId,
        fee: data.fee,
        freeShippingThreshold: data.freeShippingThreshold ?? null,
      },
      update: {
        fee: data.fee,
        freeShippingThreshold: data.freeShippingThreshold ?? null,
      },
    });
    return ShippingRateMapper.toDomain(record);
  }

  async findByZoneAndMethod(storeId: string, zoneId: string, methodId: string): Promise<ShippingRate | null> {
    const record = await this.prisma.shippingRate.findFirst({ where: { storeId, zoneId, methodId } });
    return record ? ShippingRateMapper.toDomain(record) : null;
  }

  async list(storeId: string): Promise<ShippingRate[]> {
    const records = await this.prisma.shippingRate.findMany({ where: { storeId } });
    return records.map(ShippingRateMapper.toDomain);
  }
}
