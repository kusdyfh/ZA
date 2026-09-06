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

export interface ProductFormValues {
  name: string;
  slug?: string;
  sku: string;
  shortDescription?: string;
  description?: string;
  price: number;
  discountPrice?: number;
  categoryId: string;
  brandId?: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isGiftBox?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
}
