import { useQuery } from '@tanstack/react-query';
import { apiFetchPaginated, buildQueryString } from '@/lib/api/client';
import type { ListParams } from '@/lib/api/list-params';

export interface Color {
  id: string;
  name: string;
  hexCode: string;
}

export function useColorsQuery(params: ListParams = {}) {
  return useQuery({
    queryKey: ['colors', params],
    queryFn: () => apiFetchPaginated<Color>(`/catalog/colors${buildQueryString(params)}`, { auth: false }),
  });
}
