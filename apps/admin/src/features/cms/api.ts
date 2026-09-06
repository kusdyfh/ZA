import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import type { CmsPage, UpsertCmsPageInput } from './types';

const LIST_KEY = 'cms-pages';

export function useCmsPagesQuery() {
  return useQuery({
    queryKey: [LIST_KEY],
    queryFn: () => apiFetch<CmsPage[]>('/cms/pages'),
  });
}

export function useCmsPageQuery(slug: string) {
  return useQuery({
    queryKey: [LIST_KEY, slug],
    queryFn: () => apiFetch<CmsPage>(`/cms/pages/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useUpsertCmsPageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertCmsPageInput) => apiFetch<CmsPage>('/cms/pages', { method: 'PUT', body: input }),
    onSuccess: (page) => {
      void queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
      queryClient.setQueryData([LIST_KEY, page.slug], page);
    },
  });
}

export function useSetCmsPagePublishedMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, published }: { slug: string; published: boolean }) =>
      apiFetch<CmsPage>(`/cms/pages/${slug}/${published ? 'publish' : 'unpublish'}`, { method: 'POST' }),
    onSuccess: (page) => {
      void queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
      queryClient.setQueryData([LIST_KEY, page.slug], page);
    },
  });
}
