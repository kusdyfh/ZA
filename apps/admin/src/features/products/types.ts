export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** The storefront homepage's distinct, admin-curated product sections — see apps/storefront/src/app/home-content.tsx. */
export const PRODUCT_PLACEMENTS = [
  'HOME_HERO',
  'ART_STORY_WALL',
  'TEN_PRODUCTS_SHOWCASE',
  'ZA_EDIT_BOOK',
  'DOLL_DRESS_UP',
] as const;
export type ProductPlacement = (typeof PRODUCT_PLACEMENTS)[number];

export const PRODUCT_PLACEMENT_LABELS: Record<ProductPlacement, string> = {
  HOME_HERO: 'Home Hero',
  ART_STORY_WALL: 'Art / Story Wall',
  TEN_PRODUCTS_SHOWCASE: '10 Products Showcase',
  ZA_EDIT_BOOK: 'The Book (ZA Edit)',
  DOLL_DRESS_UP: 'Doll Dress-Up',
};

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
  placements: ProductPlacement[];
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
  placements?: ProductPlacement[];
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
}
