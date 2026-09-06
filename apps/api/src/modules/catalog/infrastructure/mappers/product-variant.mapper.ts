import type { ProductVariant as ProductVariantRecord } from '@prisma/client';
import { ProductVariant } from '../../domain/entities/product-variant.entity';
import { Money } from '../../domain/value-objects/money.vo';

export class ProductVariantMapper {
  /**
   * `currencyCode` isn't stored on the variant itself — a price override
   * is always in the owning product's currency, so the repository joins
   * to fetch it rather than duplicating the column.
   */
  static toDomain(this: void, record: ProductVariantRecord, currencyCode: string): ProductVariant {
    return ProductVariant.reconstitute({
      id: record.id,
      storeId: record.storeId,
      productId: record.productId,
      sku: record.sku,
      barcode: record.barcode,
      colorId: record.colorId,
      sizeId: record.sizeId,
      priceOverride: record.priceOverride ? Money.create(record.priceOverride.toString(), currencyCode) : null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
