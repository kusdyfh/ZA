import { cn } from '@za/shared';

export interface CloudProps {
  className?: string;
  color?: string;
}

/** A soft rounded cloud shape (ADR 0028 §8) — general "dreamy" atmosphere accent. */
export function Cloud({ className, color = 'currentColor' }: CloudProps) {
  return (
    <svg
      viewBox="0 0 64 32"
      fill={color}
      className={cn('h-8 w-16', className)}
      aria-hidden="true"
    >
      <path d="M17 26c-6.6 0-12-5-12-11.2C5 8.9 9.9 4 16 4c1.9 0 3.7.5 5.3 1.3C23.4 2 27.4 0 32 0c7.3 0 13.4 5.2 14.6 12 5.5.7 9.4 5.3 9.4 10.8 0 5.9-4.9 10.7-11 10.7H17Z" />
    </svg>
  );
}
