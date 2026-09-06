import type { MetadataRoute } from 'next';
import { apiFetch, apiFetchPaginated } from '@/lib/api/client';
import { SITE_URL } from '@/lib/seo';
import type { Category } from '@/features/categories/types';
import type { Collection } from '@/features/collections/types';
import type { Product } from '@/features/products/types';
import type { CmsPage } from '@/features/cms/types';

/** Mirrors `CMS_PAGE_SLUGS` (apps/api/src/modules/cms/domain/cms-page-slugs.ts) — the fixed, known set of CMS routes this epic scopes. */
const CMS_PAGE_SLUGS = ['about', 'contact', 'faq', 'privacy-policy', 'terms-of-service'] as const;

const PAGE_LIMIT = 100;

async function fetchAllPages<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const result = await apiFetchPaginated<T>(`${path}${path.includes('?') ? '&' : '?'}page=${page}&limit=${PAGE_LIMIT}`, {
      auth: false,
    });
    items.push(...result.data);
    totalPages = result.meta.totalPages;
    page += 1;
  } while (page <= totalPages);
  return items;
}

/**
 * Every `ACTIVE` product, every category, every live collection, and
 * every `PUBLISHED` CMS page (ADR 0025) — no new infrastructure, this is
 * a standard Next.js file convention re-fetching the existing Public
 * Catalog API (ADR 0021).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/shop`, priority: 0.9 },
    { url: `${SITE_URL}/categories`, priority: 0.7 },
    { url: `${SITE_URL}/collections`, priority: 0.7 },
  ];

  const cmsEntries = await Promise.all(
    CMS_PAGE_SLUGS.map(async (slug): Promise<MetadataRoute.Sitemap[number] | null> => {
      try {
        const page = await apiFetch<CmsPage>(`/storefront/cms/pages/${slug}`, { auth: false });
        return { url: `${SITE_URL}/${slug}`, lastModified: new Date(page.updatedAt), priority: 0.6 };
      } catch {
        return null;
      }
    }),
  );

  const [categories, collections, products] = await Promise.all([
    fetchAllPages<Category>('/catalog/categories'),
    apiFetch<Collection[]>('/catalog/storefront/collections', { auth: false }),
    fetchAllPages<Product>('/catalog/storefront/products'),
  ]);

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((category) => category.isActive)
    .map((category) => ({ url: `${SITE_URL}/categories/${category.slug}`, priority: 0.6 }));

  const collectionEntries: MetadataRoute.Sitemap = collections.map((collection) => ({
    url: `${SITE_URL}/collections/${collection.slug}`,
    priority: 0.6,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/products/${product.slug}`,
    priority: 0.8,
  }));

  return [
    ...staticEntries,
    ...cmsEntries.filter((entry): entry is MetadataRoute.Sitemap[number] => entry !== null),
    ...categoryEntries,
    ...collectionEntries,
    ...productEntries,
  ];
}
