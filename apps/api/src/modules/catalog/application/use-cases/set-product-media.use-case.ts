import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import {
  PRODUCT_MEDIA_REPOSITORY,
  type ProductMediaInput,
  type ProductMediaRepository,
} from '../../domain/repositories/product-media.repository';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/repositories/product.repository';
import { ProductPolicy } from '../../domain/policies/product-policy';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';

export interface SetProductMediaInput {
  productId: string;
  media: ProductMediaInput[];
}

/**
 * Fully replaces a product's media set + order in one call, matching
 * the "drag-to-reorder" UI (docs/product/03-PRODUCTS.md). Validates the
 * whole set via ProductPolicy before writing anything: at most one
 * cover, cover must be an image, every image has alt text, and — if the
 * product is currently Active — the new set must still include a cover.
 */
@Injectable()
export class SetProductMediaUseCase {
  constructor(
    @Inject(PRODUCT_MEDIA_REPOSITORY) private readonly media: ProductMediaRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: SetProductMediaInput): Promise<void> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const product = await this.products.findById(storeId, input.productId);
    if (!product) {
      throw new ProductNotFoundError(input.productId);
    }

    ProductPolicy.validateMediaSet(input.media);
    ProductPolicy.assertActiveProductKeepsCoverImage(product, input.media);

    await this.media.replaceForProduct(input.productId, input.media);
  }
}
