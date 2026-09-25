import type { ReactNode } from 'react';
import { cn } from '@za/shared';

export interface StickerProps {
  children: ReactNode;
  className?: string;
  tone?: 'rose' | 'plum' | 'gold' | 'lavender';
  rotate?: number;
}

/** ADR 0029 §4 — same rose/plum (frequent) + gold/lavender (≤10%, never together) tone family as PortraitBlob. */
const TONE_CLASSES: Record<NonNullable<StickerProps['tone']>, string> = {
  rose: 'bg-brand-petal-100 text-brand-berry',
  plum: 'bg-brand-plum-tint text-brand-plum',
  gold: 'bg-brand-gold-tint text-brand-berry',
  lavender: 'bg-brand-lavender-tint text-brand-plum',
};

/** A small circular/scalloped badge (ADR 0029 §8), slightly rotated for a hand-placed feel — for "New", lifestyle, or category tags. */
export function Sticker({
  children,
  className,
  tone = 'rose',
  rotate = -4,
}: StickerProps) {
  return (
    <span
      className={cn(
        'shadow-brand-tight inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
        TONE_CLASSES[tone],
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}
