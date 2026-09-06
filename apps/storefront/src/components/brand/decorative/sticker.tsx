import type { ReactNode } from 'react';
import { cn } from '@za/shared';

export interface StickerProps {
  children: ReactNode;
  className?: string;
  tone?: 'blush' | 'butter' | 'sky' | 'plum';
  rotate?: number;
}

const TONE_CLASSES: Record<NonNullable<StickerProps['tone']>, string> = {
  blush: 'bg-brand-blush-100 text-brand-blush-700',
  butter: 'bg-brand-butter-100 text-brand-butter-700',
  sky: 'bg-brand-sky-100 text-brand-sky-700',
  plum: 'bg-brand-plum-100 text-brand-plum-700',
};

/** A small circular/scalloped badge (ADR 0028 §8), slightly rotated for a hand-placed feel — for "New", lifestyle, or category tags. */
export function Sticker({ children, className, tone = 'blush', rotate = -4 }: StickerProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-brand-soft',
        TONE_CLASSES[tone],
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}
