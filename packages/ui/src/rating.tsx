import { Star } from 'lucide-react';
import { cn } from '@za/shared';

export interface RatingProps {
  value: number;
  count?: number;
  size?: 'sm' | 'md';
  className?: string;
}

/** Read-only star rating — product cards, PDP review summary, review list rows. */
export function Rating({ value, count, size = 'sm', className }: RatingProps) {
  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  const rounded = Math.round(value);

  return (
    <div className={cn('flex items-center gap-1', className)} aria-label={`Rated ${value} out of 5`}>
      <div className="flex items-center gap-0.5" role="img">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              starSize,
              index < rounded ? 'fill-warning-500 text-warning-500' : 'text-neutral-300 dark:text-neutral-700',
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">({count})</span>
      )}
    </div>
  );
}
