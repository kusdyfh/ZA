import { cn } from '@za/shared';

export interface SparkleProps {
  className?: string;
  color?: string;
}

/** A 4-point sparkle accent (ADR 0028 §8) — the primary decorative micro-motif. */
export function Sparkle({ className, color = 'currentColor' }: SparkleProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={color}
      className={cn('h-4 w-4', className)}
      aria-hidden="true"
    >
      <path d="M12 0c.6 4.8 2.2 8 4.8 9.6.5.3 1 .5 1.6.7.6.2 1.2.3 1.6.4-.4.1-1 .2-1.6.4-.6.2-1.1.4-1.6.7-2.6 1.6-4.2 4.8-4.8 9.6-.6-4.8-2.2-8-4.8-9.6-.5-.3-1-.5-1.6-.7-.6-.2-1.2-.3-1.6-.4.4-.1 1-.2 1.6-.4.6-.2 1.1-.4 1.6-.7C9.8 8 11.4 4.8 12 0Z" />
    </svg>
  );
}
