import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Collection } from '../../domain/entities/collection.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import {
  COLLECTION_REPOSITORY,
  type CollectionRepository,
} from '../../domain/repositories/collection.repository';
import { SlugAlreadyInUseError } from '../../domain/errors/catalog.errors';

export interface CreateCollectionInput {
  name: string;
  slug?: string;
  description?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

@Injectable()
export class CreateCollectionUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: CreateCollectionInput): Promise<Collection> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const name = Collection.validateName(input.name);
    const slug = input.slug ? Slug.fromRaw(input.slug) : Slug.fromName(name);

    const existing = await this.collections.findBySlug(storeId, slug.toString());
    if (existing) {
      throw new SlugAlreadyInUseError(slug.toString());
    }

    const startsAt = input.startsAt ?? null;
    const endsAt = input.endsAt ?? null;
    Collection.validateSchedule(startsAt, endsAt);

    const seo = SeoMetadata.create({
      metaTitle: input.metaTitle ?? name,
      metaDescription: input.metaDescription ?? input.description ?? null,
    });

    return this.collections.create({
      storeId,
      name,
      slug,
      description: input.description ?? null,
      startsAt,
      endsAt,
      seo,
    });
  }
}
