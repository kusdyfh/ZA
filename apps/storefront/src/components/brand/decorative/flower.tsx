import { cn } from '@za/shared';

export interface FlowerProps {
  className?: string;
  petalColor?: string;
  centerColor?: string;
}

/** A simple 5-petal doodle flower (ADR 0028 §8/§9) — general storybook motif. */
export function Flower({ className, petalColor = 'currentColor', centerColor = '#FFD966' }: FlowerProps) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-6 w-6', className)} aria-hidden="true">
      <g fill={petalColor}>
        <ellipse cx="16" cy="7" rx="5" ry="7" />
        <ellipse cx="16" cy="25" rx="5" ry="7" />
        <ellipse cx="7" cy="16" rx="7" ry="5" />
        <ellipse cx="25" cy="16" rx="7" ry="5" />
      </g>
      <circle cx="16" cy="16" r="4.5" fill={centerColor} />
    </svg>
  );
}
