import type { Size as SizeRecord } from '@prisma/client';
import { Size } from '../../domain/entities/size.entity';

export class SizeMapper {
  static toDomain(this: void, record: SizeRecord): Size {
    return Size.reconstitute({
      id: record.id,
      storeId: record.storeId,
      label: record.label,
      sortOrder: record.sortOrder,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
