import type { Category } from '../entities/category.entity';
import type { Slug } from '../value-objects/slug.vo';
import type { SeoMetadata } from '../value-objects/seo-metadata.vo';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface CreateCategoryData {
  storeId: string;
  name: string;
  slug: Slug;
  description: string | null;
  sortOrder: number;
  parentId: string | null;
  seo: SeoMetadata;
}

export interface CategoryRepository {
  create(data: CreateCategoryData): Promise<Category>;
  save(category: Category): Promise<void>;
  findById(storeId: string, id: string): Promise<Category | null>;
  findBySlug(storeId: string, slug: string): Promise<Category | null>;
  list(storeId: string): Promise<Category[]>;
  delete(storeId: string, id: string): Promise<void>;
  /** Used by the "cannot delete a non-empty category" guard. */
  countChildren(storeId: string, categoryId: string): Promise<number>;
  countProducts(storeId: string, categoryId: string): Promise<number>;
}
