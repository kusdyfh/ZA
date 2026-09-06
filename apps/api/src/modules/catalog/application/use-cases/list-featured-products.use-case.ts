import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Product } from '../../domain/entities/product.entity';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/repositories/product.repository';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';

/**
 * Storefront-facing curated list: unlike the admin's generic
 * ListProductsUseCase, this always restricts to ACTIVE (visible)
 * products — a homepage "Featured" section should never surface a Draft
 * or Archived product regardless of its isFeatured flag.
 */
@Injectable()
export class ListFeaturedProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(): Promise<Product[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.products.list(storeId, { status: PRODUCT_STATUS.ACTIVE, isFeatured: true });
  }
}
