import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import {
  COLLECTION_REPOSITORY,
  type CollectionRepository,
} from '../../domain/repositories/collection.repository';
import { CollectionNotFoundError } from '../../domain/errors/catalog.errors';

export interface DeleteCollectionInput {
  collectionId: string;
}

/** CollectionProduct is `onDelete: Cascade` (schema.prisma) — no order-history-style restriction applies. */
@Injectable()
export class DeleteCollectionUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: DeleteCollectionInput): Promise<void> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const collection = await this.collections.findById(storeId, input.collectionId);
    if (!collection) {
      throw new CollectionNotFoundError(input.collectionId);
    }
    await this.collections.delete(storeId, collection.id);
  }
}
