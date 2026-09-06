import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import type { CmsPage } from './types';

const CMS_KEY = 'cms-page';

/** Public storefront read (ADR 0025) — mirrors the `catalog/storefront` query-options pattern from ADR 0021. */
export function cmsPageQueryOptions(slug: string) {
  return {
    queryKey: [CMS_KEY, slug],
    queryFn: () => apiFetch<CmsPage>(`/storefront/cms/pages/${slug}`, { auth: false }),
  };
}

export function useCmsPageQuery(slug: string) {
  return useQuery({ ...cmsPageQueryOptions(slug), enabled: Boolean(slug) });
}
