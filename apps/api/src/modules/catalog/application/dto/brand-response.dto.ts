import type { Brand } from '../../domain/entities/brand.entity';

export class BrandResponseDto {
  id!: string;
  name!: string;
  slug!: string;
  description!: string | null;

  static fromDomain(brand: Brand): BrandResponseDto {
    const dto = new BrandResponseDto();
    dto.id = brand.id;
    dto.name = brand.name;
    dto.slug = brand.slug.toString();
    dto.description = brand.description;
    return dto;
  }
}
