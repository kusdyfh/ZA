import type { Color as ColorRecord } from '@prisma/client';
import { Color } from '../../domain/entities/color.entity';

export class ColorMapper {
  static toDomain(this: void, record: ColorRecord): Color {
    return Color.reconstitute({
      id: record.id,
      storeId: record.storeId,
      name: record.name,
      hexCode: record.hexCode,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
