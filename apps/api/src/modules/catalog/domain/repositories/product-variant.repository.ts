import type { ProductVariant } from '../entities/product-variant.entity';
import type { Money } from '../value-objects/money.vo';

export const PRODUCT_VARIANT_REPOSITORY = Symbol('PRODUCT_VARIANT_REPOSITORY');

export interface CreateProductVariantData {
  storeId: string;
  productId: string;
  sku: string;
  barcode: string | null;
  colorId: string | null;
  sizeId: string | null;
  priceOverride: Money | null;
}

export interface ProductVariantRepository {
  create(data: CreateProductVariantData): Promise<ProductVariant>;
  save(variant: ProductVariant): Promise<void>;
  findById(storeId: string, id: string): Promise<ProductVariant | null>;
  findBySku(storeId: string, sku: string): Promise<ProductVariant | null>;
  findByBarcode(storeId: string, barcode: string): Promise<ProductVariant | null>;
  listByProduct(storeId: string, productId: string): Promise<ProductVariant[]>;
  /** Used by ProductPolicy.assertReadyForActive's "at least one variant" check. */
  countByProduct(storeId: string, productId: string): Promise<number>;
  delete(storeId: string, id: string): Promise<void>;
}
