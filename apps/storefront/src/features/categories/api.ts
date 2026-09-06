import { useQuery } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated, buildQueryString } from '@/lib/api/client';
import type { ListParams } from '@/lib/api/list-params';
import type { Category, CategoryTreeNode } from './types';

const CATEGORIES_KEY = 'categories';

export function categoryTreeQueryOptions() {
  return {
    queryKey: [CATEGORIES_KEY, 'tree'],
    queryFn: () => apiFetch<CategoryTreeNode[]>('/catalog/categories/tree', { auth: false }),
  };
}

export function useCategoryTreeQuery() {
  return useQuery(categoryTreeQueryOptions());
}

export function useCategoriesQuery(params: ListParams = {}) {
  return useQuery({
    queryKey: [CATEGORIES_KEY, params],
    queryFn: () => apiFetchPaginated<Category>(`/catalog/categories${buildQueryString(params)}`, { auth: false }),
  });
}
