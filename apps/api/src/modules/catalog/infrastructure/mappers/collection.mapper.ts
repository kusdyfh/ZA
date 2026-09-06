import type { Collection as CollectionRecord } from '@prisma/client';
import { Collection } from '../../domain/entities/collection.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';

export class CollectionMapper {
  static toDomain(this: void, record: CollectionRecord): Collection {
    return Collection.reconstitute({
      id: record.id,
      storeId: record.storeId,
      name: record.name,
      slug: Slug.fromRaw(record.slug),
      description: record.description,
      isActive: record.isActive,
      startsAt: record.startsAt,
      endsAt: record.endsAt,
      seo: SeoMetadata.create({
        metaTitle: record.metaTitle,
        metaDescription: record.metaDescription,
      }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
