import { cn } from '@za/shared';

export interface PaperTapeProps {
  className?: string;
  tone?: 'rose' | 'gold' | 'lavender';
  rotate?: number;
}

const TONE_CLASSES: Record<NonNullable<PaperTapeProps['tone']>, string> = {
  rose: 'bg-brand-petal-300/80',
  gold: 'bg-brand-gold/70',
  lavender: 'bg-brand-lavender/70',
};

/** A washi-tape-style strip (ADR 0029 §8) — for card corners, "pinned to a corkboard" feel. */
export function PaperTape({
  className,
  tone = 'rose',
  rotate = -6,
}: PaperTapeProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute h-6 w-20 rounded-sm shadow-sm',
        TONE_CLASSES[tone],
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    />
  );
}
