'use client';

import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@za/shared';
import { Skeleton } from './skeleton';

export interface DataTableColumn<TRow> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'right';
  render: (row: TRow) => ReactNode;
}

export interface DataTableSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DataTableProps<TRow> {
  columns: Array<DataTableColumn<TRow>>;
  rows: TRow[];
  rowKey: (row: TRow) => string;
  isLoading?: boolean;
  skeletonRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  sort?: DataTableSort;
  onSortChange?: (field: string) => void;
  onRowClick?: (row: TRow) => void;
}

/**
 * Admin data table per docs/09-DESIGN-SYSTEM.md §7 — sticky header,
 * sortable columns, row hover, right-aligned numerics, skeleton-row
 * loading (never a spinner overlay), illustration+copy+CTA empty state.
 */
export function DataTable<TRow>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  skeletonRows = 5,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  sort,
  onSortChange,
  onRowClick,
}: DataTableProps<TRow>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'border-b border-neutral-200 px-4 py-3 font-medium text-neutral-600 dark:border-neutral-800 dark:text-neutral-300',
                  column.align === 'right' ? 'text-right' : 'text-left',
                )}
              >
                {column.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSortChange?.(column.key)}
                    className={cn(
                      'inline-flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-100',
                      column.align === 'right' && 'flex-row-reverse',
                    )}
                  >
                    {column.header}
                    {sort?.field === column.key ? (
                      sort.direction === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
                    )}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-neutral-100 dark:border-neutral-800/60">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-full max-w-[10rem]" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <p className="font-medium text-neutral-700 dark:text-neutral-200">{emptyTitle}</p>
                {emptyDescription && (
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{emptyDescription}</p>
                )}
                {emptyAction && <div className="mt-4 flex justify-center">{emptyAction}</div>}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-neutral-100 last:border-0 dark:border-neutral-800/60',
                  onRowClick && 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40',
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-3 text-neutral-700 dark:text-neutral-300',
                      column.align === 'right' && 'text-right tabular-nums',
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
