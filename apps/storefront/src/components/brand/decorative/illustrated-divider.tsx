import { cn } from '@za/shared';

export interface IllustratedDividerProps {
  className?: string;
  color?: string;
}

/** A wavy/scalloped section separator (ADR 0028 §8) — replaces hard straight section breaks. */
export function IllustratedDivider({ className, color = '#F5E6D3' }: IllustratedDividerProps) {
  return (
    <svg
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      className={cn('h-8 w-full', className)}
      aria-hidden="true"
    >
      <path
        d="M0 20c50-20 100-20 150 0s100 20 150 0 100-20 150 0 100 20 150 0 100-20 150 0 100 20 150 0 100-20 150 0 100 20 150 0v20H0Z"
        fill={color}
      />
    </svg>
  );
}
