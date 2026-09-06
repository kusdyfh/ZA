import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Product } from '../../domain/entities/product.entity';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/repositories/product.repository';
import {
  PRODUCT_VARIANT_REPOSITORY,
  type ProductVariantRepository,
} from '../../domain/repositories/product-variant.repository';
import {
  PRODUCT_MEDIA_REPOSITORY,
  type ProductMediaRepository,
} from '../../domain/repositories/product-media.repository';
import { PRODUCT_STATUS, type ProductStatusValue } from '../../domain/constants/product-status.constants';
import { ProductPolicy } from '../../domain/policies/product-policy';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';

export interface ChangeProductStatusInput {
  productId: string;
  status: ProductStatusValue;
}

/**
 * Every transition is allowed except moving TO Active, which must pass
 * ProductPolicy.assertReadyForActive() first — this is the use-case that
 * closes the gap Epic 3A disclosed (variant/cover-image checks didn't
 * exist yet). See docs/epics/EPIC-03B-ARCHITECTURE-COMPLIANCE.md.
 */
@Injectable()
export class ChangeProductStatusUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepository,
    @Inject(PRODUCT_MEDIA_REPOSITORY) private readonly media: ProductMediaRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: ChangeProductStatusInput): Promise<Product> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const product = await this.products.findById(storeId, input.productId);
    if (!product) {
      throw new ProductNotFoundError(input.productId);
    }

    if (input.status === PRODUCT_STATUS.ACTIVE) {
      const [variantCount, mediaList] = await Promise.all([
        this.variants.countByProduct(storeId, product.id),
        this.media.listByProduct(product.id),
      ]);
      ProductPolicy.assertReadyForActive(product, {
        hasVariant: variantCount > 0,
        hasCoverImage: mediaList.some((item) => item.isCover),
      });
    }

    product.changeStatus(input.status);
    await this.products.save(product);
    return product;
  }
}
