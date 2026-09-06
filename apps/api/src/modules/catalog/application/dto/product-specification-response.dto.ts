import type { ProductSpecificationItem } from '../../domain/repositories/product-specification.repository';

export class ProductSpecificationResponseDto {
  id!: string;
  label!: string;
  value!: string;
  sortOrder!: number;

  static fromItem(item: ProductSpecificationItem): ProductSpecificationResponseDto {
    const dto = new ProductSpecificationResponseDto();
    dto.id = item.id;
    dto.label = item.label;
    dto.value = item.value;
    dto.sortOrder = item.sortOrder;
    return dto;
  }
}
