import type { ProductMediaTypeValue } from '../constants/product-media-type.constants';

export const PRODUCT_MEDIA_REPOSITORY = Symbol('PRODUCT_MEDIA_REPOSITORY');

export interface ProductMediaItem {
  id: string;
  productId: string;
  type: ProductMediaTypeValue;
  url: string;
  altText: string | null;
  sortOrder: number;
  isCover: boolean;
  /** The color this image shows; null = shared by every color of the product. */
  colorId: string | null;
}

export interface ProductMediaInput {
  type: ProductMediaTypeValue;
  url: string;
  altText: string | null;
  isCover: boolean;
  colorId: string | null;
}

/**
 * No storeId parameter — per docs/v2/adr/0013, ProductMedia has no
 * independent unique business key and is always reached through an
 * already store-validated productId.
 */
export interface ProductMediaRepository {
  /** Fully replaces a product's media set + order in one call. */
  replaceForProduct(
    productId: string,
    media: ProductMediaInput[],
  ): Promise<void>;
  listByProduct(productId: string): Promise<ProductMediaItem[]>;
}
