import type { Brand as BrandRecord } from '@prisma/client';
import { Brand } from '../../domain/entities/brand.entity';
import { Slug } from '../../domain/value-objects/slug.vo';

export class BrandMapper {
  static toDomain(this: void, record: BrandRecord): Brand {
    return Brand.reconstitute({
      id: record.id,
      storeId: record.storeId,
      name: record.name,
      slug: Slug.fromRaw(record.slug),
      description: record.description,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
