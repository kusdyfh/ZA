import type { Brand } from '../entities/brand.entity';
import type { Slug } from '../value-objects/slug.vo';

export const BRAND_REPOSITORY = Symbol('BRAND_REPOSITORY');

export interface CreateBrandData {
  storeId: string;
  name: string;
  slug: Slug;
  description: string | null;
}

export interface BrandRepository {
  create(data: CreateBrandData): Promise<Brand>;
  save(brand: Brand): Promise<void>;
  findById(storeId: string, id: string): Promise<Brand | null>;
  findBySlug(storeId: string, slug: string): Promise<Brand | null>;
  list(storeId: string): Promise<Brand[]>;
  delete(storeId: string, id: string): Promise<void>;
}
