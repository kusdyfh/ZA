import { useState } from 'react';
import type { DataTableSort } from '@za/ui';

export interface TableState {
  page: number;
  limit: number;
  search: string;
  sort?: DataTableSort;
}

/** Shared page/limit/search/sort state for every list page's DataTable + Pagination + search box. */
export function useTableState(initialLimit = 20) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<DataTableSort | undefined>(undefined);

  function toggleSort(field: string) {
    setSort((current) => {
      if (current?.field !== field) {
        return { field, direction: 'asc' };
      }
      return current.direction === 'asc' ? { field, direction: 'desc' } : undefined;
    });
    setPage(1);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateLimit(value: number) {
    setLimit(value);
    setPage(1);
  }

  return {
    page,
    limit,
    search,
    sort,
    setPage,
    setLimit: updateLimit,
    setSearch: updateSearch,
    toggleSort,
    sortParam: sort ? `${sort.field}:${sort.direction}` : undefined,
  };
}
