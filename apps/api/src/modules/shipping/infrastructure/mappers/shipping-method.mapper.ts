import type { ShippingMethod as PrismaShippingMethod } from '@prisma/client';
import { ShippingMethod } from '../../domain/entities/shipping-method.entity';

export class ShippingMethodMapper {
  static toDomain(this: void, record: PrismaShippingMethod): ShippingMethod {
    return ShippingMethod.reconstitute({
      id: record.id,
      storeId: record.storeId,
      name: record.name,
      minDays: record.minDays,
      maxDays: record.maxDays,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
