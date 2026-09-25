import { cn } from '@za/shared';

export interface HeartProps {
  className?: string;
  /** Solid for emphasis (favorites, taglines); outline for secondary UI (ADR 0029 §8). */
  filled?: boolean;
}

/** A heart accent (ADR 0029 §8) — the second core decorative motif alongside Sparkle. */
export function Heart({ className, filled = false }: HeartProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-4 w-4', className)}
      aria-hidden="true"
    >
      {filled ? (
        <path
          d="M12 21s-7.5-4.6-10.2-9.3C.2 8.9 1.4 5.2 4.8 4.2c2.1-.6 4.2.2 5.4 1.9l1.8 2.5 1.8-2.5c1.2-1.7 3.3-2.5 5.4-1.9 3.4 1 4.6 4.7 3 7.5C19.5 16.4 12 21 12 21Z"
          fill="currentColor"
        />
      ) : (
        <path
          d="M12 21s-7.5-4.6-10.2-9.3C.2 8.9 1.4 5.2 4.8 4.2c2.1-.6 4.2.2 5.4 1.9l1.8 2.5 1.8-2.5c1.2-1.7 3.3-2.5 5.4-1.9 3.4 1 4.6 4.7 3 7.5C19.5 16.4 12 21 12 21Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      )}
    </svg>
  );
}
