import { cn } from '@za/shared';

export interface MedicalDoodleProps {
  className?: string;
  color?: string;
  variant?: 'stethoscope' | 'cross';
}

/**
 * A small line-art medical-fashion accent (ADR 0028 §8/§9), generalized from
 * the lab-coat-and-stethoscope centerpiece in the reference art into a
 * reusable decorative mark rather than a one-off illustration.
 */
export function MedicalDoodle({ className, color = 'currentColor', variant = 'stethoscope' }: MedicalDoodleProps) {
  if (variant === 'cross') {
    return (
      <svg viewBox="0 0 32 32" className={cn('h-6 w-6', className)} aria-hidden="true">
        <rect x="13" y="4" width="6" height="24" rx="2.5" fill={color} />
        <rect x="4" y="13" width="24" height="6" rx="2.5" fill={color} />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-6 w-6', className)}
      aria-hidden="true"
    >
      <path d="M8 4v9a5 5 0 0 0 10 0V4" />
      <path d="M13 20a5 5 0 0 0 10 0v-3" />
      <circle cx="25.5" cy="20" r="2.5" fill={color} stroke="none" />
    </svg>
  );
}
