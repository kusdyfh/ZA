import { cn } from '@za/shared';

export interface BowProps {
  className?: string;
}

/**
 * A small hand-tied ribbon bow (ADR 0029 §8 decorative family) — distinct
 * from the `Logo`'s own reserved bow mark, which ADR 0029 keeps for the
 * logo/packaging/section-dividers only. This one is free to sprinkle
 * anywhere a scene calls for a ribbon-and-bow accent.
 */
export function Bow({ className }: BowProps) {
  return (
    <svg
      viewBox="0 0 64 40"
      className={cn('h-6 w-10', className)}
      aria-hidden="true"
    >
      <path
        d="M30 20 6 6c-3 8-3 20 0 28 10-4 20-9 24-14Z"
        fill="currentColor"
        opacity=".92"
      />
      <path
        d="M34 20 58 6c3 8 3 20 0 28-10-4-20-9-24-14Z"
        fill="currentColor"
      />
      <rect x="27" y="14" width="10" height="12" rx="3" fill="currentColor" />
      <path
        d="M30 26c-2 4-2.5 8-1 12M34 26c2 4 2.5 8 1 12"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
