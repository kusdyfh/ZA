import type { ProductResponseDto } from './product-response.dto';
import type { ProductVariantResponseDto } from './product-variant-response.dto';
import type { ProductMediaResponseDto } from './product-media-response.dto';
import type { ProductSpecificationResponseDto } from './product-specification-response.dto';

/** The full public PDP response shape (ADR 0021 §2). */
export class PublicProductDetailResponseDto {
  product!: ProductResponseDto;
  variants!: ProductVariantResponseDto[];
  media!: ProductMediaResponseDto[];
  specifications!: ProductSpecificationResponseDto[];
  related!: ProductResponseDto[];
  crossSell!: ProductResponseDto[];
  upSell!: ProductResponseDto[];
}
