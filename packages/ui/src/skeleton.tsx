import type { HTMLAttributes } from 'react';
import { cn } from '@za/shared';

/**
 * Loading placeholder per docs/09-DESIGN-SYSTEM.md §7 — tables render
 * skeleton rows, never a spinner overlay, to avoid a layout jump when
 * real content arrives.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800', className)}
      {...props}
    />
  );
}
