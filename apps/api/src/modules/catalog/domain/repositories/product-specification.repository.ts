export const PRODUCT_SPECIFICATION_REPOSITORY = Symbol('PRODUCT_SPECIFICATION_REPOSITORY');

export interface ProductSpecificationItem {
  id: string;
  productId: string;
  label: string;
  value: string;
  sortOrder: number;
}

export interface ProductSpecificationInput {
  label: string;
  value: string;
}

/** No storeId parameter — same reasoning as ProductMediaRepository (see docs/v2/adr/0013). */
export interface ProductSpecificationRepository {
  replaceForProduct(productId: string, specs: ProductSpecificationInput[]): Promise<void>;
  listByProduct(productId: string): Promise<ProductSpecificationItem[]>;
}
