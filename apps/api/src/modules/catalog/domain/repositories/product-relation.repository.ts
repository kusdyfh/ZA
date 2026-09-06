import type { Product } from '../entities/product.entity';
import type { ProductRelationTypeValue } from '../constants/product-relation-type.constants';

export const PRODUCT_RELATION_REPOSITORY = Symbol('PRODUCT_RELATION_REPOSITORY');

/** No storeId parameter — same reasoning as ProductMediaRepository (see docs/v2/adr/0013). */
export interface ProductRelationRepository {
  /** Fully replaces a product's relations of one type + order in one call. */
  replace(productId: string, type: ProductRelationTypeValue, relatedProductIds: string[]): Promise<void>;
  listRelatedProducts(productId: string, type: ProductRelationTypeValue): Promise<Product[]>;
}
