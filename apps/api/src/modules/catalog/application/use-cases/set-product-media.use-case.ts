import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import {
  PRODUCT_MEDIA_REPOSITORY,
  type ProductMediaInput,
  type ProductMediaRepository,
} from '../../domain/repositories/product-media.repository';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../domain/repositories/product.repository';
import {
  COLOR_REPOSITORY,
  type ColorRepository,
} from '../../domain/repositories/color.repository';
import { ProductPolicy } from '../../domain/policies/product-policy';
import { PRODUCT_MEDIA_TYPE } from '../../domain/constants/product-media-type.constants';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import {
  ColorNotFoundError,
  ProductNotFoundError,
} from '../../domain/errors/catalog.errors';

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
 * An entry may name the `colorId` it shows (the storefront gallery filters
 * on it); every referenced color must exist in the current store. Also
 * keeps `Product.seo.ogImageUrl` synced to the cover image per
 * docs/product/03-PRODUCTS.md §SEO ("defaults to the primary product
 * image") — list/grid views only carry `ogImageUrl`, not the full media
 * set, so this is what actually makes a product's photo show up there.
 */
@Injectable()
export class SetProductMediaUseCase {
  constructor(
    @Inject(PRODUCT_MEDIA_REPOSITORY)
    private readonly media: ProductMediaRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(COLOR_REPOSITORY) private readonly colors: ColorRepository,
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

    const colorIds = [
      ...new Set(
        input.media
          .map((item) => item.colorId)
          .filter((id): id is string => id !== null),
      ),
    ];
    for (const colorId of colorIds) {
      if (!(await this.colors.findById(storeId, colorId))) {
        throw new ColorNotFoundError(colorId);
      }
    }

    await this.media.replaceForProduct(input.productId, input.media);

    const coverImage = input.media.find(
      (item) => item.isCover && item.type === PRODUCT_MEDIA_TYPE.IMAGE,
    );
    const ogImageUrl = coverImage?.url ?? null;
    if (ogImageUrl !== product.seo.ogImageUrl) {
      product.updateSeo(
        SeoMetadata.create({
          metaTitle: product.seo.metaTitle,
          metaDescription: product.seo.metaDescription,
          ogImageUrl,
        }),
      );
      await this.products.save(product);
    }
  }
}
