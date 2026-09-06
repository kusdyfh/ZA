import type { Tag as TagRecord } from '@prisma/client';
import { Tag } from '../../domain/entities/tag.entity';
import { Slug } from '../../domain/value-objects/slug.vo';

export class TagMapper {
  static toDomain(this: void, record: TagRecord): Tag {
    return Tag.reconstitute({
      id: record.id,
      storeId: record.storeId,
      name: record.name,
      slug: Slug.fromRaw(record.slug),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
