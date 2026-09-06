import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import {
  COLLECTION_REPOSITORY,
  type CollectionRepository,
} from '../../domain/repositories/collection.repository';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/repositories/product.repository';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import {
  ArchivedProductNotAddableError,
  CollectionNotFoundError,
  ProductNotFoundError,
} from '../../domain/errors/catalog.errors';

export interface SetCollectionProductsInput {
  collectionId: string;
  productIds: string[];
}

/**
 * Fully replaces a collection's membership + order in one call — matches
 * the "product picker with search and drag-to-reorder" UI
 * (docs/product/05-COLLECTIONS.md), which saves the whole list at once
 * rather than one add/remove/reorder operation at a time.
 */
@Injectable()
export class SetCollectionProductsUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: SetCollectionProductsInput): Promise<void> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const collection = await this.collections.findById(storeId, input.collectionId);
    if (!collection) {
      throw new CollectionNotFoundError(input.collectionId);
    }

    const uniqueIds = [...new Set(input.productIds)];
    const found = await this.products.findManyByIds(storeId, uniqueIds);
    const foundIds = new Set(found.map((product) => product.id));

    const missing = uniqueIds.find((id) => !foundIds.has(id));
    if (missing) {
      throw new ProductNotFoundError(missing);
    }

    const archived = found.find((product) => product.status === PRODUCT_STATUS.ARCHIVED);
    if (archived) {
      throw new ArchivedProductNotAddableError(archived.id);
    }

    await this.collections.replaceProducts(storeId, collection.id, uniqueIds);
  }
}
