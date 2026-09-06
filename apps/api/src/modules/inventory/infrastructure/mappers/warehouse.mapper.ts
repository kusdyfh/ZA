import type { Warehouse as WarehouseRecord } from '@prisma/client';
import { Warehouse } from '../../domain/entities/warehouse.entity';

export class WarehouseMapper {
  static toDomain(this: void, record: WarehouseRecord): Warehouse {
    return Warehouse.reconstitute({
      id: record.id,
      storeId: record.storeId,
      name: record.name,
      code: record.code,
      isDefault: record.isDefault,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
