import { cn } from '@za/shared';

export interface PaperTapeProps {
  className?: string;
  tone?: 'blush' | 'butter' | 'sky';
  rotate?: number;
}

const TONE_CLASSES: Record<NonNullable<PaperTapeProps['tone']>, string> = {
  blush: 'bg-brand-blush-200/80',
  butter: 'bg-brand-butter-300/80',
  sky: 'bg-brand-sky-300/80',
};

/** A washi-tape-style strip (ADR 0028 §8) — for card corners, "pinned to a corkboard" feel. */
export function PaperTape({ className, tone = 'blush', rotate = -6 }: PaperTapeProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('absolute h-6 w-20 rounded-sm shadow-sm', TONE_CLASSES[tone], className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    />
  );
}
