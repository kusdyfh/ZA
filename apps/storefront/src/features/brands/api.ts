import { useQuery } from '@tanstack/react-query';
import { apiFetchPaginated, buildQueryString } from '@/lib/api/client';
import type { ListParams } from '@/lib/api/list-params';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export function useBrandsQuery(params: ListParams = {}) {
  return useQuery({
    queryKey: ['brands', params],
    queryFn: () => apiFetchPaginated<Brand>(`/catalog/brands${buildQueryString(params)}`, { auth: false }),
  });
}
