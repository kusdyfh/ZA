import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { ProductVariant } from '../../domain/entities/product-variant.entity';
import type { ProductMediaItem } from '../../domain/repositories/product-media.repository';
import type { ProductSpecificationItem } from '../../domain/repositories/product-specification.repository';
import { PRODUCT_RELATION_TYPE } from '../../domain/constants/product-relation-type.constants';
import { GetPublicProductBySlugUseCase } from './get-public-product-by-slug.use-case';
import { GetProductDetailUseCase } from './get-product-detail.use-case';
import { ListProductRelationsUseCase } from './list-product-relations.use-case';

export interface GetPublicProductDetailInput {
  slug: string;
}

export interface PublicProductDetail {
  product: Product;
  variants: ProductVariant[];
  media: ProductMediaItem[];
  specifications: ProductSpecificationItem[];
  related: Product[];
  crossSell: Product[];
  upSell: Product[];
}

/**
 * The full public PDP read model (ADR 0021 §2) — pure composition over
 * three already-existing use-cases, no new business logic beyond the
 * slug→ACTIVE gate `GetPublicProductBySlugUseCase` already provides.
 */
@Injectable()
export class GetPublicProductDetailUseCase {
  constructor(
    private readonly getPublicProductBySlug: GetPublicProductBySlugUseCase,
    private readonly getProductDetail: GetProductDetailUseCase,
    private readonly listProductRelations: ListProductRelationsUseCase,
  ) {}

  async execute(input: GetPublicProductDetailInput): Promise<PublicProductDetail> {
    const product = await this.getPublicProductBySlug.execute({ slug: input.slug });

    const [detail, related, crossSell, upSell] = await Promise.all([
      this.getProductDetail.execute({ productId: product.id }),
      this.listProductRelations.execute({ productId: product.id, type: PRODUCT_RELATION_TYPE.RELATED }),
      this.listProductRelations.execute({ productId: product.id, type: PRODUCT_RELATION_TYPE.CROSS_SELL }),
      this.listProductRelations.execute({ productId: product.id, type: PRODUCT_RELATION_TYPE.UP_SELL }),
    ]);

    return {
      product: detail.product,
      variants: detail.variants,
      media: detail.media,
      specifications: detail.specifications,
      related,
      crossSell,
      upSell,
    };
  }
}
