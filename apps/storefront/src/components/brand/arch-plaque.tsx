import type { ReactNode } from 'react';
import { cn } from '@za/shared';
import { Sparkle } from './decorative';

export interface ArchPlaqueProps {
  children: ReactNode;
  className?: string;
}

/**
 * A rounded arch-top signboard (ADR 0029 §8), set in the hand-written
 * `--font-script` accent font — the "dashed frame, hand-lettered" signage
 * motif from the identity book, generalized into a reusable section-
 * eyebrow/label shape.
 */
export function ArchPlaque({ children, className }: ArchPlaqueProps) {
  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        className,
      )}
    >
      <Sparkle className="text-brand-gold animate-brand-twinkle absolute -left-3 -top-2 h-3 w-3" />
      <Sparkle className="text-brand-gold animate-brand-twinkle absolute -right-4 -top-1 h-4 w-4 [animation-delay:400ms]" />
      <div
        className="rounded-b-brand-md border-brand-petal-300/60 bg-brand-gold-tint shadow-brand-soft rounded-t-[999px] border px-8 py-3"
        style={{ borderRadius: '999px 999px 20px 20px' }}
      >
        <span className="font-script text-brand-berry text-2xl leading-none sm:text-3xl">
          {children}
        </span>
      </div>
    </div>
  );
}
