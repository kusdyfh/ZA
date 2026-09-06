import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Collection } from '../../domain/entities/collection.entity';
import {
  COLLECTION_REPOSITORY,
  type CollectionRepository,
} from '../../domain/repositories/collection.repository';

/**
 * The list-all-collections endpoint that never existed before (ADR
 * 0021 §2, closes PROJECT_STATUS.md gap #14) — reuses the repository's
 * existing (previously unfronted-by-any-use-case) `list(storeId)` plus
 * the `Collection` entity's own pre-existing `isCurrentlyLive()`.
 */
@Injectable()
export class ListPublicCollectionsUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(): Promise<Collection[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const collections = await this.collections.list(storeId);
    return collections.filter((collection) => collection.isCurrentlyLive());
  }
}
