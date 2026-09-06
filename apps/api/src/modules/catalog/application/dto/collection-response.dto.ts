import type { Collection } from '../../domain/entities/collection.entity';

export class CollectionResponseDto {
  id!: string;
  name!: string;
  slug!: string;
  description!: string | null;
  isActive!: boolean;
  startsAt!: Date | null;
  endsAt!: Date | null;
  isCurrentlyLive!: boolean;
  metaTitle!: string | null;
  metaDescription!: string | null;

  static fromDomain(collection: Collection): CollectionResponseDto {
    const dto = new CollectionResponseDto();
    dto.id = collection.id;
    dto.name = collection.name;
    dto.slug = collection.slug.toString();
    dto.description = collection.description;
    dto.isActive = collection.isActive;
    dto.startsAt = collection.startsAt;
    dto.endsAt = collection.endsAt;
    dto.isCurrentlyLive = collection.isCurrentlyLive();
    dto.metaTitle = collection.seo.metaTitle;
    dto.metaDescription = collection.seo.metaDescription;
    return dto;
  }
}
