import type { ComponentType, SVGProps } from 'react';
import { cn } from '@za/shared';
import { Sparkle } from './decorative';

export interface PortraitBlobProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: 'blush' | 'butter' | 'sky' | 'plum';
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<PortraitBlobProps['tone']>, string> = {
  blush: 'bg-brand-blush-100 text-brand-blush-600',
  butter: 'bg-brand-butter-100 text-brand-butter-700',
  sky: 'bg-brand-sky-100 text-brand-sky-700',
  plum: 'bg-brand-plum-100 text-brand-plum-700',
};

/**
 * A soft organic-blob "portrait" placeholder (ADR 0028 §9 disclosed scope:
 * local placeholder art for this epic is an abstract composition in the
 * brand's own decorative language — Sparkle + blob + a representative line
 * icon — not painted figurative character art, which is asset-production
 * work for a future epic). Used by CharacterCard and StorySection so every
 * lifestyle moment has a consistent, tasteful stand-in illustration.
 */
export function PortraitBlob({ icon: Icon, tone = 'blush', className }: PortraitBlobProps) {
  return (
    <div
      className={cn('relative flex items-center justify-center', TONE_CLASSES[tone], className)}
      style={{ borderRadius: '63% 37% 54% 46% / 43% 45% 55% 57%' }}
    >
      <Icon className="h-10 w-10" aria-hidden="true" strokeWidth={1.6} />
      <Sparkle className="absolute right-[12%] top-[10%] h-4 w-4 text-brand-glow-strong animate-brand-twinkle" />
    </div>
  );
}
