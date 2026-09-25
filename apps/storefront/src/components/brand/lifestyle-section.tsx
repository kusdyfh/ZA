import type { ComponentType, SVGProps } from 'react';
import Link from 'next/link';
import { cn } from '@za/shared';
import { PortraitBlob } from './portrait-blob';

export interface LifestyleMoment {
  title: string;
  caption: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: 'rose' | 'plum' | 'gold' | 'lavender';
  href: string;
}

export interface LifestyleSectionProps {
  moments: LifestyleMoment[];
  className?: string;
}

/**
 * A magazine-style grid of daily "lifestyle moments" (ADR 0028 §6, brief's
 * "Medical Lifestyle" homepage block) — distinct from `CharacterCarousel`'s
 * personas: shorter, denser, asymmetric tile grid rather than a horizontal
 * scroll of full character cards.
 */
export function LifestyleSection({
  moments,
  className,
}: LifestyleSectionProps) {
  return (
    <div
      className={cn(
        'mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 sm:px-6 md:grid-cols-4 md:gap-6',
        className,
      )}
    >
      {moments.map((moment, index) => (
        <Link
          key={moment.title}
          href={moment.href}
          className={cn(
            'rounded-brand-lg bg-brand-paper shadow-brand-tight group flex flex-col items-center gap-3 p-5 text-center transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
            index % 3 === 1 && 'md:mt-8',
          )}
        >
          <PortraitBlob
            icon={moment.icon}
            tone={moment.tone}
            className="h-16 w-16"
          />
          <div>
            <p className="font-display text-brand-ink text-base font-semibold">
              {moment.title}
            </p>
            <p className="text-brand-mauve mt-1 text-xs">{moment.caption}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
