import { cn } from '@za/shared';

export interface DoodleUnderlineProps {
  className?: string;
  color?: string;
}

/** A loose, hand-drawn accent line (ADR 0028 §8) — sits under headline text as a soft emphasis mark, not a formal underline. */
export function DoodleUnderline({ className, color = 'currentColor' }: DoodleUnderlineProps) {
  return (
    <svg
      viewBox="0 0 160 12"
      className={cn('h-3 w-40', className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M2 8c20-6 40-6 58-2 18 4 36 4 58-1 14-3.5 28-3.5 40 1"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
