import type { Category as CategoryRecord } from '@prisma/client';
import { Category } from '../../domain/entities/category.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';

export class CategoryMapper {
  static toDomain(this: void, record: CategoryRecord): Category {
    return Category.reconstitute({
      id: record.id,
      storeId: record.storeId,
      name: record.name,
      slug: Slug.fromRaw(record.slug),
      description: record.description,
      sortOrder: record.sortOrder,
      isActive: record.isActive,
      parentId: record.parentId,
      seo: SeoMetadata.create({
        metaTitle: record.metaTitle,
        metaDescription: record.metaDescription,
      }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
