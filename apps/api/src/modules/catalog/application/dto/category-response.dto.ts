import type { Category } from '../../domain/entities/category.entity';

export class CategoryResponseDto {
  id!: string;
  name!: string;
  slug!: string;
  description!: string | null;
  sortOrder!: number;
  isActive!: boolean;
  parentId!: string | null;
  metaTitle!: string | null;
  metaDescription!: string | null;

  static fromDomain(category: Category): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.slug = category.slug.toString();
    dto.description = category.description;
    dto.sortOrder = category.sortOrder;
    dto.isActive = category.isActive;
    dto.parentId = category.parentId;
    dto.metaTitle = category.seo.metaTitle;
    dto.metaDescription = category.seo.metaDescription;
    return dto;
  }
}
