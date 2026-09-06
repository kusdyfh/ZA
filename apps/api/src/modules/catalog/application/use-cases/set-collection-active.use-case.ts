import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Collection } from '../../domain/entities/collection.entity';
import {
  COLLECTION_REPOSITORY,
  type CollectionRepository,
} from '../../domain/repositories/collection.repository';
import { CollectionNotFoundError } from '../../domain/errors/catalog.errors';

export interface SetCollectionActiveInput {
  collectionId: string;
  isActive: boolean;
}

@Injectable()
export class SetCollectionActiveUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: SetCollectionActiveInput): Promise<Collection> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const collection = await this.collections.findById(storeId, input.collectionId);
    if (!collection) {
      throw new CollectionNotFoundError(input.collectionId);
    }

    if (input.isActive) {
      collection.activate();
    } else {
      collection.deactivate();
    }

    await this.collections.save(collection);
    return collection;
  }
}
