import type { Collection } from '../entities/collection.entity';
import type { Product } from '../entities/product.entity';
import type { Slug } from '../value-objects/slug.vo';
import type { SeoMetadata } from '../value-objects/seo-metadata.vo';

export const COLLECTION_REPOSITORY = Symbol('COLLECTION_REPOSITORY');

export interface CreateCollectionData {
  storeId: string;
  name: string;
  slug: Slug;
  description: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  seo: SeoMetadata;
}

export interface CollectionProductEntry {
  product: Product;
  sortOrder: number;
}

export interface CollectionRepository {
  create(data: CreateCollectionData): Promise<Collection>;
  save(collection: Collection): Promise<void>;
  findById(storeId: string, id: string): Promise<Collection | null>;
  findBySlug(storeId: string, slug: string): Promise<Collection | null>;
  list(storeId: string): Promise<Collection[]>;
  delete(storeId: string, id: string): Promise<void>;
  /** Fully replaces membership + order in one transaction. */
  replaceProducts(storeId: string, collectionId: string, orderedProductIds: string[]): Promise<void>;
  listProducts(storeId: string, collectionId: string): Promise<CollectionProductEntry[]>;
}
