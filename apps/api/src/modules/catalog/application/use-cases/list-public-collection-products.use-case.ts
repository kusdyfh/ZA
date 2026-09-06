import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import { ListCollectionProductsUseCase } from './list-collection-products.use-case';

export interface ListPublicCollectionProductsInput {
  collectionId: string;
}

/**
 * ACTIVE-only collection-products read (ADR 0021 §3). The pre-existing
 * `ListCollectionProductsUseCase` (behind the older, already-public
 * `GET /catalog/collections/:id/products`) only excludes `ARCHIVED` —
 * left untouched deliberately, since it's a route that predates this
 * epic and "keep admin endpoints unchanged" is read literally here.
 * This use-case delegates to it fully, then applies the stricter,
 * correct `ACTIVE`-only filter this epic's rule requires, without
 * changing the older use-case or route at all.
 */
@Injectable()
export class ListPublicCollectionProductsUseCase {
  constructor(private readonly listCollectionProducts: ListCollectionProductsUseCase) {}

  async execute(input: ListPublicCollectionProductsInput): Promise<Product[]> {
    const products = await this.listCollectionProducts.execute({ collectionId: input.collectionId });
    return products.filter((product) => product.status === PRODUCT_STATUS.ACTIVE);
  }
}
