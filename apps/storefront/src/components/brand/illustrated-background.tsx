import type { ReactNode } from 'react';
import { cn } from '@za/shared';
import { Cloud, FloatingDecoration, Sparkle, TwinkleStar } from './decorative';

export interface IllustratedBackgroundProps {
  children: ReactNode;
  className?: string;
  tone?: 'hero' | 'section' | 'spotlight' | 'newsletter';
}

const TONE_CLASSES: Record<NonNullable<IllustratedBackgroundProps['tone']>, string> = {
  hero: 'bg-brand-gradient-hero',
  section: 'bg-brand-gradient-section',
  spotlight: 'bg-brand-cream-100',
  newsletter: 'bg-brand-gradient-newsletter',
};

/**
 * A soft gradient backdrop scattered with ambient floating decorations
 * (ADR 0028 §7/§8) — reusable behind hero moments, quotes, and the
 * newsletter section. Purely decorative; `aria-hidden` on every ornament.
 */
export function IllustratedBackground({ children, className, tone = 'section' }: IllustratedBackgroundProps) {
  return (
    <div className={cn('relative overflow-hidden', TONE_CLASSES[tone], className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <FloatingDecoration className="absolute left-[6%] top-[12%]" speed="slow">
          <Cloud className="h-10 w-20 text-white/50" />
        </FloatingDecoration>
        <FloatingDecoration className="absolute right-[10%] top-[18%]" delayMs={600}>
          <Sparkle className="h-6 w-6 text-brand-glow-strong" />
        </FloatingDecoration>
        <FloatingDecoration className="absolute left-[14%] bottom-[16%]" delayMs={1200}>
          <TwinkleStar className="h-4 w-4 text-white/70" />
        </FloatingDecoration>
        <FloatingDecoration className="absolute right-[18%] bottom-[10%]" speed="slow" delayMs={300}>
          <Sparkle className="h-5 w-5 text-white/70" />
        </FloatingDecoration>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
