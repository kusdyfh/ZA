import type { VariantStock as VariantStockRecord } from '@prisma/client';
import { VariantStock } from '../../domain/entities/variant-stock.entity';

export class VariantStockMapper {
  static toDomain(this: void, record: VariantStockRecord): VariantStock {
    return VariantStock.reconstitute({
      id: record.id,
      variantId: record.variantId,
      warehouseId: record.warehouseId,
      quantity: record.quantity,
      lowStockThreshold: record.lowStockThreshold,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
