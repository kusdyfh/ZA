import type { ShippingZone as PrismaShippingZone } from '@prisma/client';
import { ShippingZone } from '../../domain/entities/shipping-zone.entity';

export class ShippingZoneMapper {
  static toDomain(this: void, record: PrismaShippingZone): ShippingZone {
    return ShippingZone.reconstitute({
      id: record.id,
      storeId: record.storeId,
      name: record.name,
      governorates: record.governorates,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
