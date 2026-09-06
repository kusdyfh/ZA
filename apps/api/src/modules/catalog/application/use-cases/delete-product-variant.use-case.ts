import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import {
  PRODUCT_VARIANT_REPOSITORY,
  type ProductVariantRepository,
} from '../../domain/repositories/product-variant.repository';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/repositories/product.repository';
import { ProductPolicy } from '../../domain/policies/product-policy';
import { ProductNotFoundError, ProductVariantNotFoundError } from '../../domain/errors/catalog.errors';

export interface DeleteProductVariantInput {
  variantId: string;
}

/**
 * Blocks removing the last variant of a currently-Active product (via
 * ProductPolicy.assertVariantRemovable) so an Active product can never
 * silently regress out of the "≥1 variant" invariant. A Draft/Archived
 * product with zero variants is not itself invalid.
 */
@Injectable()
export class DeleteProductVariantUseCase {
  constructor(
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: DeleteProductVariantInput): Promise<void> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const variant = await this.variants.findById(storeId, input.variantId);
    if (!variant) {
      throw new ProductVariantNotFoundError(input.variantId);
    }

    const product = await this.products.findById(storeId, variant.productId);
    if (!product) {
      throw new ProductNotFoundError(variant.productId);
    }

    const currentCount = await this.variants.countByProduct(storeId, variant.productId);
    ProductPolicy.assertVariantRemovable(product, currentCount - 1);

    await this.variants.delete(storeId, variant.id);
  }
}
