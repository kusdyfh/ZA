import type { Product } from '../../domain/entities/product.entity';

export class ProductResponseDto {
  id!: string;
  name!: string;
  slug!: string;
  sku!: string;
  shortDescription!: string | null;
  description!: string | null;
  status!: string;
  price!: string;
  discountPrice!: string | null;
  currency!: string;
  categoryId!: string;
  brandId!: string | null;
  isFeatured!: boolean;
  isBestSeller!: boolean;
  isNewArrival!: boolean;
  isGiftBox!: boolean;
  isVisibleInCatalog!: boolean;
  metaTitle!: string | null;
  metaDescription!: string | null;
  ogImageUrl!: string | null;

  static fromDomain(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.slug = product.slug.toString();
    dto.sku = product.sku;
    dto.shortDescription = product.shortDescription;
    dto.description = product.description;
    dto.status = product.status;
    dto.price = product.price.toDecimalString();
    dto.discountPrice = product.discountPrice?.toDecimalString() ?? null;
    dto.currency = product.price.currency;
    dto.categoryId = product.categoryId;
    dto.brandId = product.brandId;
    dto.isFeatured = product.isFeatured;
    dto.isBestSeller = product.isBestSeller;
    dto.isNewArrival = product.isNewArrival;
    dto.isGiftBox = product.isGiftBox;
    dto.isVisibleInCatalog = product.isVisibleInCatalog();
    dto.metaTitle = product.seo.metaTitle;
    dto.metaDescription = product.seo.metaDescription;
    dto.ogImageUrl = product.seo.ogImageUrl;
    return dto;
  }
}
