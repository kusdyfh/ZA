import type { Tag } from '../../domain/entities/tag.entity';

export class TagResponseDto {
  id!: string;
  name!: string;
  slug!: string;

  static fromDomain(tag: Tag): TagResponseDto {
    const dto = new TagResponseDto();
    dto.id = tag.id;
    dto.name = tag.name;
    dto.slug = tag.slug.toString();
    return dto;
  }
}
