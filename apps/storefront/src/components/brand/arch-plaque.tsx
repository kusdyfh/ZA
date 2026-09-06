import type { ReactNode } from 'react';
import { cn } from '@za/shared';
import { Sparkle } from './decorative';

export interface ArchPlaqueProps {
  children: ReactNode;
  className?: string;
}

/**
 * A rounded arch-top signboard (ADR 0028 §6), set in the hand-written
 * `--font-script` accent font — the storybook-signage motif from the
 * reference art, generalized into a reusable section-eyebrow/label shape.
 */
export function ArchPlaque({ children, className }: ArchPlaqueProps) {
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <Sparkle className="absolute -left-3 -top-2 h-3 w-3 text-brand-glow-strong animate-brand-twinkle" />
      <Sparkle className="absolute -right-4 -top-1 h-4 w-4 text-brand-glow-strong animate-brand-twinkle [animation-delay:400ms]" />
      <div
        className="rounded-t-[999px] rounded-b-brand-md border border-brand-blush-200 bg-brand-cream-200 px-8 py-3 shadow-brand-soft"
        style={{ borderRadius: '999px 999px 20px 20px' }}
      >
        <span className="font-script text-2xl leading-none text-brand-ink sm:text-3xl">{children}</span>
      </div>
    </div>
  );
}
