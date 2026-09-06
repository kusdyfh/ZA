import type { ComponentType, SVGProps } from 'react';
import Link from 'next/link';
import { cn } from '@za/shared';
import { PortraitBlob } from './portrait-blob';
import { Sticker } from './decorative';

export interface CharacterCardProps {
  name: string;
  tagline: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: 'blush' | 'butter' | 'sky' | 'plum';
  href: string;
  className?: string;
}

/**
 * A lifestyle-persona card (ADR 0028 §6, brief's "Character Showcase").
 * Presentation only — `href` routes into the real, already-existing shop
 * (a category, collection, or filtered shop query), so "shop the look"
 * always lands on real, live product data rather than a dead end.
 */
export function CharacterCard({ name, tagline, icon, tone = 'blush', href, className }: CharacterCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex w-56 shrink-0 flex-col items-center gap-4 rounded-brand-lg bg-brand-cream-100 p-6 text-center shadow-brand-card transition-transform duration-300 hover:-translate-y-1 hover:shadow-brand-glow motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      <PortraitBlob icon={icon} tone={tone} className="h-28 w-28" />
      <div>
        <p className="font-display text-lg font-semibold text-brand-ink">{name}</p>
        <p className="mt-1 text-sm text-brand-ink-muted">{tagline}</p>
      </div>
      <Sticker tone={tone} rotate={-3}>
        Shop the look
      </Sticker>
    </Link>
  );
}
