import type { ReactNode } from 'react';
import { cn } from '@za/shared';
import { IllustratedBackground } from './illustrated-background';

export interface IllustrationBannerProps {
  eyebrow?: string;
  title: string;
  description?: string;
  tone?: 'hero' | 'section' | 'spotlight' | 'newsletter';
  children?: ReactNode;
  className?: string;
}

/** A full-width illustrated banner (ADR 0028 §6) — reusable for the Newsletter band and other mid-page promo moments. */
export function IllustrationBanner({ eyebrow, title, description, tone = 'hero', children, className }: IllustrationBannerProps) {
  return (
    <IllustratedBackground tone={tone} className={cn('rounded-brand-xl', className)}>
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-16 text-center sm:py-20">
        {eyebrow && <p className="font-script text-2xl text-white/90">{eyebrow}</p>}
        <h3 className="font-display text-3xl font-semibold text-white sm:text-4xl">{title}</h3>
        {description && <p className="max-w-md text-white/90">{description}</p>}
        {children}
      </div>
    </IllustratedBackground>
  );
}
