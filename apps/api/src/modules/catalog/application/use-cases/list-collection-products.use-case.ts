import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Product } from '../../domain/entities/product.entity';
import {
  COLLECTION_REPOSITORY,
  type CollectionRepository,
} from '../../domain/repositories/collection.repository';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import { CollectionNotFoundError } from '../../domain/errors/catalog.errors';

export interface ListCollectionProductsInput {
  collectionId: string;
}

/**
 * Storefront-facing read: excludes archived products from the live
 * display per docs/product/05-COLLECTIONS.md ("an archived product
 * should never reappear in a curated marketing list"), even though the
 * underlying CollectionProduct association still technically exists.
 */
@Injectable()
export class ListCollectionProductsUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: ListCollectionProductsInput): Promise<Product[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const collection = await this.collections.findById(storeId, input.collectionId);
    if (!collection) {
      throw new CollectionNotFoundError(input.collectionId);
    }

    const entries = await this.collections.listProducts(storeId, collection.id);
    return entries
      .filter((entry) => entry.product.status !== PRODUCT_STATUS.ARCHIVED)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((entry) => entry.product);
  }
}
