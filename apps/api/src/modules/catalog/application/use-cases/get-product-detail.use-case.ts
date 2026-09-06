import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Product } from '../../domain/entities/product.entity';
import { ProductVariant } from '../../domain/entities/product-variant.entity';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/repositories/product.repository';
import {
  PRODUCT_VARIANT_REPOSITORY,
  type ProductVariantRepository,
} from '../../domain/repositories/product-variant.repository';
import {
  PRODUCT_MEDIA_REPOSITORY,
  type ProductMediaItem,
  type ProductMediaRepository,
} from '../../domain/repositories/product-media.repository';
import {
  PRODUCT_SPECIFICATION_REPOSITORY,
  type ProductSpecificationItem,
  type ProductSpecificationRepository,
} from '../../domain/repositories/product-specification.repository';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';

export interface GetProductDetailInput {
  productId: string;
}

export interface ProductDetail {
  product: Product;
  variants: ProductVariant[];
  media: ProductMediaItem[];
  specifications: ProductSpecificationItem[];
}

/**
 * Composes the full PDP read model in one call — see
 * docs/11-STOREFRONT-SPEC.md §4 ("API calls: GET /storefront/products/:slug
 * — SSR — includes variants, media"). A thin composition over the
 * per-aggregate repositories; no new business logic of its own.
 */
@Injectable()
export class GetProductDetailUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepository,
    @Inject(PRODUCT_MEDIA_REPOSITORY) private readonly media: ProductMediaRepository,
    @Inject(PRODUCT_SPECIFICATION_REPOSITORY)
    private readonly specifications: ProductSpecificationRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: GetProductDetailInput): Promise<ProductDetail> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const product = await this.products.findById(storeId, input.productId);
    if (!product) {
      throw new ProductNotFoundError(input.productId);
    }

    const [variants, media, specifications] = await Promise.all([
      this.variants.listByProduct(storeId, product.id),
      this.media.listByProduct(product.id),
      this.specifications.listByProduct(product.id),
    ]);

    return { product, variants, media, specifications };
  }
}
