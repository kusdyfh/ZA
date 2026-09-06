import type { Tag } from '../entities/tag.entity';
import type { Slug } from '../value-objects/slug.vo';

export const TAG_REPOSITORY = Symbol('TAG_REPOSITORY');

export interface CreateTagData {
  storeId: string;
  name: string;
  slug: Slug;
}

export interface TagRepository {
  create(data: CreateTagData): Promise<Tag>;
  save(tag: Tag): Promise<void>;
  findById(storeId: string, id: string): Promise<Tag | null>;
  findBySlug(storeId: string, slug: string): Promise<Tag | null>;
  findManyByIds(storeId: string, ids: string[]): Promise<Tag[]>;
  list(storeId: string): Promise<Tag[]>;
  delete(storeId: string, id: string): Promise<void>;
}
