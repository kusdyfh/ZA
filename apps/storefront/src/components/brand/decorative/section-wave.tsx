import { cn } from '@za/shared';

export interface SectionWaveProps {
  className?: string;
  /** The color the wave hands off to — should match the very next section's own background. */
  tone?: 'cream' | 'paper';
}

const TONE_CLASSES: Record<NonNullable<SectionWaveProps['tone']>, string> = {
  cream: 'text-brand-cream',
  paper: 'text-brand-paper',
};

/**
 * A soft two-hump ground line for the bottom of a full-bleed illustrated
 * section — turns a hard color cut into an intentional "sky meets ground"
 * transition instead. `preserveAspectRatio="none"` so it stretches to any
 * section width without distortion artifacts at the seam.
 */
export function SectionWave({ className, tone = 'cream' }: SectionWaveProps) {
  return (
    <svg
      viewBox="0 0 400 40"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 w-full',
        TONE_CLASSES[tone],
        className,
      )}
    >
      <path
        d="M0 22c40-14 80-14 120 0s80 14 120 0 80-14 120 0 30 8 40 6V40H0Z"
        fill="currentColor"
      />
    </svg>
  );
}
