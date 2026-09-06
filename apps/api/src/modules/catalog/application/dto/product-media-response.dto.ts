import type { ProductMediaItem } from '../../domain/repositories/product-media.repository';

export class ProductMediaResponseDto {
  id!: string;
  type!: string;
  url!: string;
  altText!: string | null;
  sortOrder!: number;
  isCover!: boolean;

  static fromItem(item: ProductMediaItem): ProductMediaResponseDto {
    const dto = new ProductMediaResponseDto();
    dto.id = item.id;
    dto.type = item.type;
    dto.url = item.url;
    dto.altText = item.altText;
    dto.sortOrder = item.sortOrder;
    dto.isCover = item.isCover;
    return dto;
  }
}
