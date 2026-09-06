import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Product } from '../../domain/entities/product.entity';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/repositories/product.repository';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';

/** Storefront-facing curated list — see ListFeaturedProductsUseCase's doc comment for the ACTIVE-only rationale. */
@Injectable()
export class ListBestSellersUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(): Promise<Product[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.products.list(storeId, { status: PRODUCT_STATUS.ACTIVE, isBestSeller: true });
  }
}
