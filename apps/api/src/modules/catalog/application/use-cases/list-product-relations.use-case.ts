import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import {
  PRODUCT_RELATION_REPOSITORY,
  type ProductRelationRepository,
} from '../../domain/repositories/product-relation.repository';
import type { ProductRelationTypeValue } from '../../domain/constants/product-relation-type.constants';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';

export interface ListProductRelationsInput {
  productId: string;
  type: ProductRelationTypeValue;
}

/** Storefront-facing: excludes archived related products, same rule as ListCollectionProductsUseCase. */
@Injectable()
export class ListProductRelationsUseCase {
  constructor(
    @Inject(PRODUCT_RELATION_REPOSITORY) private readonly relations: ProductRelationRepository,
  ) {}

  async execute(input: ListProductRelationsInput): Promise<Product[]> {
    const related = await this.relations.listRelatedProducts(input.productId, input.type);
    return related.filter((product) => product.status !== PRODUCT_STATUS.ARCHIVED);
  }
}
