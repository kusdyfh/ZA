import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@za/shared';

export interface CalloutProps {
  tone?: 'info' | 'warning';
  children: ReactNode;
  className?: string;
}

/** Inline informational note — used to disclose a known API limitation directly in the page, not just in docs. */
export function Callout({ tone = 'info', children, className }: CalloutProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md border px-4 py-3 text-sm',
        tone === 'info' && 'border-info-500/30 bg-info-500/5 text-neutral-700 dark:text-neutral-300',
        tone === 'warning' && 'border-warning-500/30 bg-warning-500/5 text-neutral-700 dark:text-neutral-300',
        className,
      )}
    >
      <Info className={cn('mt-0.5 h-4 w-4 shrink-0', tone === 'info' ? 'text-info-500' : 'text-warning-500')} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
