import type { Product as ProductRecord } from '@prisma/client';
import { Product } from '../../domain/entities/product.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';

export class ProductMapper {
  static toDomain(this: void, record: ProductRecord): Product {
    return Product.reconstitute({
      id: record.id,
      storeId: record.storeId,
      name: record.name,
      slug: Slug.fromRaw(record.slug),
      sku: record.sku,
      shortDescription: record.shortDescription,
      description: record.description,
      status: record.status,
      price: Money.create(record.price.toString(), record.currencyCode),
      discountPrice: record.discountPrice
        ? Money.create(record.discountPrice.toString(), record.currencyCode)
        : null,
      categoryId: record.categoryId,
      brandId: record.brandId,
      isFeatured: record.isFeatured,
      isBestSeller: record.isBestSeller,
      isNewArrival: record.isNewArrival,
      isGiftBox: record.isGiftBox,
      seo: SeoMetadata.create({
        metaTitle: record.metaTitle,
        metaDescription: record.metaDescription,
        ogImageUrl: record.ogImageUrl,
      }),
      highlights: record.highlights,
      richContent: record.richContent,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
