import type { CmsFaqItem, CmsPage } from '../entities/cms-page.entity';

export const CMS_PAGE_REPOSITORY = Symbol('CMS_PAGE_REPOSITORY');

export interface UpsertCmsPageData {
  storeId: string;
  slug: string;
  title: string;
  content: string;
  faqItems?: CmsFaqItem[] | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
}

export interface CmsPageRepository {
  findBySlug(storeId: string, slug: string): Promise<CmsPage | null>;
  /** `PUBLISHED`-only — the storefront's public read (ADR 0025), enforced server-side like Catalog's `ACTIVE`-only surface. */
  findPublishedBySlug(storeId: string, slug: string): Promise<CmsPage | null>;
  list(storeId: string): Promise<CmsPage[]>;
  upsert(data: UpsertCmsPageData): Promise<CmsPage>;
  save(page: CmsPage): Promise<void>;
}
