import type { ReactNode } from 'react';
import { cn } from '@za/shared';
import { ArchPlaque } from './arch-plaque';
import { DoodleUnderline, FloatingDecoration, Sparkle } from './decorative';

export interface EditorialHeaderProps {
  eyebrow: string;
  description?: ReactNode;
  className?: string;
}

/**
 * The illustrated hero band shared by About/Contact/FAQ (ADR 0028 §7,
 * brief's "illustrated editorial pages") — a Server-Component-safe,
 * no-hooks composition (no `'use client'` needed by anything it renders),
 * so it works directly in these CMS-fetching server pages. Fixed light
 * palette, self-contained above each page's untouched CMS-driven content.
 */
export function EditorialHeader({ eyebrow, description, className }: EditorialHeaderProps) {
  return (
    <div className={cn('relative overflow-hidden bg-brand-gradient-section py-14 text-center', className)}>
      <FloatingDecoration className="absolute left-[8%] top-6" speed="slow">
        <Sparkle className="h-5 w-5 text-brand-blush-300" />
      </FloatingDecoration>
      <FloatingDecoration className="absolute right-[10%] top-8" delayMs={500}>
        <Sparkle className="h-4 w-4 text-brand-butter-500" />
      </FloatingDecoration>
      <ArchPlaque className="mx-auto">{eyebrow}</ArchPlaque>
      {description && <p className="mx-auto mt-4 max-w-md px-4 text-sm text-brand-ink-muted">{description}</p>}
      <div className="mt-2 flex justify-center">
        <DoodleUnderline className="text-brand-blush-300" />
      </div>
    </div>
  );
}
