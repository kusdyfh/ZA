import type { ComponentType, SVGProps } from 'react';
import { cn } from '@za/shared';
import { Sparkle } from './decorative';

export interface PortraitBlobProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: 'rose' | 'plum' | 'gold' | 'lavender';
  className?: string;
}

/**
 * ADR 0029 §4 — four tones built from the identity's own palette. `rose` and
 * `plum` are the ~30% mid-tier family (freely repeatable); `gold` and
 * `lavender` are the ≤10% rare-accent family — callers should use at most
 * one of these two per composition, never both together (ADR 0029 §4).
 */
const TONE_CLASSES: Record<NonNullable<PortraitBlobProps['tone']>, string> = {
  rose: 'bg-brand-petal-100 text-brand-berry',
  plum: 'bg-brand-plum-tint text-brand-plum',
  gold: 'bg-brand-gold-tint text-brand-berry',
  lavender: 'bg-brand-lavender-tint text-brand-plum',
};

/**
 * A soft organic-blob "portrait" placeholder (ADR 0029 §6 disclosed scope:
 * local placeholder art for this epic is an abstract composition in the
 * brand's own decorative language — Sparkle + blob + a representative line
 * icon — not painted figurative character art, which is asset-production
 * work for a future epic). Used by CharacterCard and StorySection so every
 * lifestyle moment has a consistent, tasteful stand-in illustration.
 */
export function PortraitBlob({
  icon: Icon,
  tone = 'rose',
  className,
}: PortraitBlobProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        TONE_CLASSES[tone],
        className,
      )}
      style={{ borderRadius: '63% 37% 54% 46% / 43% 45% 55% 57%' }}
    >
      <Icon className="h-10 w-10" aria-hidden="true" strokeWidth={1.6} />
      <Sparkle className="text-brand-gold animate-brand-twinkle absolute right-[12%] top-[10%] h-4 w-4" />
    </div>
  );
}
