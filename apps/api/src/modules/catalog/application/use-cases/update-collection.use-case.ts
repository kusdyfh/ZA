import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Collection } from '../../domain/entities/collection.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import {
  COLLECTION_REPOSITORY,
  type CollectionRepository,
} from '../../domain/repositories/collection.repository';
import { CollectionNotFoundError, SlugAlreadyInUseError } from '../../domain/errors/catalog.errors';

export interface UpdateCollectionInput {
  collectionId: string;
  name: string;
  slug?: string;
  description?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

@Injectable()
export class UpdateCollectionUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: UpdateCollectionInput): Promise<Collection> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const collection = await this.collections.findById(storeId, input.collectionId);
    if (!collection) {
      throw new CollectionNotFoundError(input.collectionId);
    }

    const name = Collection.validateName(input.name);
    const slug = input.slug ? Slug.fromRaw(input.slug) : Slug.fromName(name);
    if (!slug.equals(collection.slug)) {
      const existing = await this.collections.findBySlug(storeId, slug.toString());
      if (existing) {
        throw new SlugAlreadyInUseError(slug.toString());
      }
    }

    collection.rename(name);
    collection.changeSlug(slug);
    collection.updateDescription(input.description ?? null);
    collection.schedule(input.startsAt ?? null, input.endsAt ?? null);
    collection.updateSeo(
      SeoMetadata.create({
        metaTitle: input.metaTitle ?? name,
        metaDescription: input.metaDescription ?? input.description ?? null,
      }),
    );

    await this.collections.save(collection);
    return collection;
  }
}
