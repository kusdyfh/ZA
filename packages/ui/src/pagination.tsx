'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@za/shared';
import { Select } from './select';

export interface PaginationProps {
  page: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
}

/**
 * Table pagination footer per docs/09-DESIGN-SYSTEM.md §7 — page
 * numbers plus a "Rows per page" select.
 */
export function Pagination({
  page,
  totalPages,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800 sm:flex-row">
      {onLimitChange && (
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 dark:text-neutral-400">Rows per page</span>
          <Select
            aria-label="Rows per page"
            className="h-8 w-20"
            value={String(limit)}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            options={limitOptions.map((option) => ({ value: String(option), label: String(option) }))}
          />
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={cn(
            'rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800',
          )}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="text-neutral-600 dark:text-neutral-300">
          Page {page} of {safeTotalPages}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            'rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800',
          )}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
