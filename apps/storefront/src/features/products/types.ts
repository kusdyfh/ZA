export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  description: string | null;
  status: ProductStatus;
  price: string;
  discountPrice: string | null;
  currency: string;
  categoryId: string;
  brandId: string | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isGiftBox: boolean;
  isVisibleInCatalog: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  colorId: string | null;
  sizeId: string | null;
  priceOverride: string | null;
}

export type ProductMediaType = 'IMAGE' | 'VIDEO';

export interface ProductMedia {
  id: string;
  type: ProductMediaType;
  url: string;
  altText: string | null;
  sortOrder: number;
  isCover: boolean;
  colorId: string | null;
}

export interface ProductSpecification {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
}

export interface PublicProductDetail {
  product: Product;
  variants: ProductVariant[];
  media: ProductMedia[];
  specifications: ProductSpecification[];
  related: Product[];
  crossSell: Product[];
  upSell: Product[];
}
