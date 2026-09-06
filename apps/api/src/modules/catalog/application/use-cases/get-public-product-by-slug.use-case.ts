import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Product } from '../../domain/entities/product.entity';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/repositories/product.repository';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';

export interface GetPublicProductBySlugInput {
  slug: string;
}

/**
 * Public PDP entry point (ADR 0021 §2) — resolves a slug via the same
 * `findBySlug` the admin create/update flows already use for
 * uniqueness checks, then gates on `ACTIVE`. A non-ACTIVE or missing
 * product looks identical to the caller (`ProductNotFoundError`) —
 * never reveal that a Draft/Archived product exists at this slug.
 */
@Injectable()
export class GetPublicProductBySlugUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: GetPublicProductBySlugInput): Promise<Product> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const product = await this.products.findBySlug(storeId, input.slug);
    if (!product || product.status !== PRODUCT_STATUS.ACTIVE) {
      throw new ProductNotFoundError(input.slug);
    }
    return product;
  }
}
