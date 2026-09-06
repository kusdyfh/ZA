import { useQuery } from '@tanstack/react-query';
import { apiFetchPaginated, buildQueryString } from '@/lib/api/client';
import type { ListParams } from '@/lib/api/list-params';

export interface Size {
  id: string;
  label: string;
  sortOrder: number;
}

export function useSizesQuery(params: ListParams = {}) {
  return useQuery({
    queryKey: ['sizes', params],
    queryFn: () => apiFetchPaginated<Size>(`/catalog/sizes${buildQueryString(params)}`, { auth: false }),
  });
}
