import type { ShippingRate as PrismaShippingRate } from '@prisma/client';
import { ShippingRate } from '../../domain/entities/shipping-rate.entity';

export class ShippingRateMapper {
  static toDomain(this: void, record: PrismaShippingRate): ShippingRate {
    return ShippingRate.reconstitute({
      id: record.id,
      storeId: record.storeId,
      zoneId: record.zoneId,
      methodId: record.methodId,
      fee: record.fee.toNumber(),
      freeShippingThreshold: record.freeShippingThreshold?.toNumber() ?? null,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
