import { cn } from '@za/shared';

export interface TwinkleStarProps {
  className?: string;
  color?: string;
}

/** A soft 5-point star (ADR 0028 §8) — secondary star variant, pairs with Sparkle for varied ambient decoration. */
export function TwinkleStar({ className, color = 'currentColor' }: TwinkleStarProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={color}
      className={cn('h-3 w-3', className)}
      aria-hidden="true"
    >
      <path d="M12 1.5 14.4 9l7.6.1-6.1 4.7 2.3 7.2L12 16.7l-6.2 4.3 2.3-7.2L2 8.9l7.6.1L12 1.5Z" />
    </svg>
  );
}
