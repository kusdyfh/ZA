import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@za/shared';

/**
 * Status badge per docs/09-DESIGN-SYSTEM.md §7 (Badges) — a status
 * column is always rendered as one of these, never raw enum text.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
        info: 'bg-info-500/10 text-info-500 dark:bg-info-500/20',
        success: 'bg-success-500/10 text-success-500 dark:bg-success-500/20',
        warning: 'bg-warning-500/10 text-warning-500 dark:bg-warning-500/20',
        danger: 'bg-danger-500/10 text-danger-500 dark:bg-danger-500/20',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
