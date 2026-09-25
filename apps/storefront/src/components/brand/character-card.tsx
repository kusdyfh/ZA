import type { ComponentType, SVGProps } from 'react';
import Link from 'next/link';
import { cn } from '@za/shared';
import { PortraitBlob } from './portrait-blob';
import { Sticker } from './decorative';

export interface CharacterCardProps {
  name: string;
  tagline: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: 'rose' | 'plum' | 'gold' | 'lavender';
  href: string;
  className?: string;
}

/**
 * A lifestyle-persona card (ADR 0029 §6, brief's "Character Showcase").
 * Presentation only — `href` routes into the real, already-existing shop
 * (a category, collection, or filtered shop query), so "shop the look"
 * always lands on real, live product data rather than a dead end.
 */
export function CharacterCard({
  name,
  tagline,
  icon,
  tone = 'rose',
  href,
  className,
}: CharacterCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-brand-lg bg-brand-paper shadow-brand-tight hover:shadow-brand-glow group flex w-56 shrink-0 flex-col items-center gap-4 p-6 text-center transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      <PortraitBlob icon={icon} tone={tone} className="h-28 w-28" />
      <div>
        <p className="font-display text-brand-ink text-lg font-semibold">
          {name}
        </p>
        <p className="text-brand-mauve mt-1 text-sm">{tagline}</p>
      </div>
      <Sticker tone={tone} rotate={-3}>
        Shop the look
      </Sticker>
    </Link>
  );
}
