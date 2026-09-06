import type { Product } from '../entities/product.entity';
import type { Slug } from '../value-objects/slug.vo';
import type { Money } from '../value-objects/money.vo';
import type { SeoMetadata } from '../value-objects/seo-metadata.vo';
import type { ProductStatusValue } from '../constants/product-status.constants';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface CreateProductData {
  storeId: string;
  name: string;
  slug: Slug;
  sku: string;
  shortDescription: string | null;
  description: string | null;
  price: Money;
  discountPrice: Money | null;
  categoryId: string;
  brandId: string | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isGiftBox: boolean;
  seo: SeoMetadata;
  highlights: string[];
  richContent: string | null;
}

export interface ProductListFilters {
  status?: ProductStatusValue;
  categoryId?: string;
  brandId?: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  /** Inclusive price-range bounds — additive, Epic 9.5 (ADR 0021 §4). */
  priceMin?: number;
  priceMax?: number;
  /** Matches products with at least one variant carrying this color/size. */
  colorId?: string;
  sizeId?: string;
}

/** Every method is store-scoped per docs/v2/adr/0006 and docs/v2/adr/0012. */
export interface ProductRepository {
  create(data: CreateProductData): Promise<Product>;
  save(product: Product): Promise<void>;
  findById(storeId: string, id: string): Promise<Product | null>;
  findBySlug(storeId: string, slug: string): Promise<Product | null>;
  findBySku(storeId: string, sku: string): Promise<Product | null>;
  findManyByIds(storeId: string, ids: string[]): Promise<Product[]>;
  list(storeId: string, filters?: ProductListFilters): Promise<Product[]>;
  replaceTags(storeId: string, productId: string, tagIds: string[]): Promise<void>;
  listTagIds(storeId: string, productId: string): Promise<string[]>;
}
