import type { ProductVariant } from '../../domain/entities/product-variant.entity';

export class ProductVariantResponseDto {
  id!: string;
  productId!: string;
  sku!: string;
  barcode!: string | null;
  colorId!: string | null;
  sizeId!: string | null;
  priceOverride!: string | null;

  static fromDomain(variant: ProductVariant): ProductVariantResponseDto {
    const dto = new ProductVariantResponseDto();
    dto.id = variant.id;
    dto.productId = variant.productId;
    dto.sku = variant.sku;
    dto.barcode = variant.barcode;
    dto.colorId = variant.colorId;
    dto.sizeId = variant.sizeId;
    dto.priceOverride = variant.priceOverride?.toDecimalString() ?? null;
    return dto;
  }
}
