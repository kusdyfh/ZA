import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import {
  PRODUCT_RELATION_REPOSITORY,
  type ProductRelationRepository,
} from '../../domain/repositories/product-relation.repository';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/repositories/product.repository';
import type { ProductRelationTypeValue } from '../../domain/constants/product-relation-type.constants';
import { ProductNotFoundError, SelfProductRelationError } from '../../domain/errors/catalog.errors';

export interface SetProductRelationsInput {
  productId: string;
  type: ProductRelationTypeValue;
  relatedProductIds: string[];
}

/**
 * Admin-curated (not algorithmic) — see schema.prisma's comment on the
 * `ProductRelation` model for why. Covers "Related Products," "Cross-
 * sell," and "Up-sell" through one mechanism, discriminated by `type`.
 */
@Injectable()
export class SetProductRelationsUseCase {
  constructor(
    @Inject(PRODUCT_RELATION_REPOSITORY) private readonly relations: ProductRelationRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: SetProductRelationsInput): Promise<void> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const product = await this.products.findById(storeId, input.productId);
    if (!product) {
      throw new ProductNotFoundError(input.productId);
    }

    const uniqueIds = [...new Set(input.relatedProductIds)];
    if (uniqueIds.includes(input.productId)) {
      throw new SelfProductRelationError();
    }

    const found = await this.products.findManyByIds(storeId, uniqueIds);
    const foundIds = new Set(found.map((related) => related.id));
    const missing = uniqueIds.find((id) => !foundIds.has(id));
    if (missing) {
      throw new ProductNotFoundError(missing);
    }

    await this.relations.replace(input.productId, input.type, uniqueIds);
  }
}
