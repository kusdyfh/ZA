import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@za/shared';
import type { Character } from '@/features/characters/types';

export interface CharacterSelectorProps {
  characters: Character[];
  activeIndex: number;
  onChange: (index: number) => void;
  className?: string;
}

/**
 * Previous/next navigation between reusable character bases. Arrows are
 * only rendered once a second character exists to switch to (today there's
 * only Rose) — same conditional-nav convention as the existing
 * `DressShowcase` component. On touch devices this is a tap target, not a
 * swipe gesture: swipe-to-switch is layered on for free once this sits
 * inside a native `overflow-x-auto`/`snap-x` scroller, the same technique
 * `CharacterCarousel` already uses, rather than hand-rolled touch-event math.
 */
export function CharacterSelector({
  characters,
  activeIndex,
  onChange,
  className,
}: CharacterSelectorProps) {
  if (characters.length === 0) return null;

  const active = characters[activeIndex]!;
  const prevIndex = (activeIndex - 1 + characters.length) % characters.length;
  const nextIndex = (activeIndex + 1) % characters.length;

  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      {characters.length > 1 && (
        <button
          type="button"
          aria-label="Previous character"
          onClick={() => onChange(prevIndex)}
          className="text-brand-ink shadow-brand-soft hover:bg-brand-blush-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      <div className="text-center">
        <p className="font-display text-brand-ink text-lg font-semibold">
          {active.name}
        </p>
        <p className="text-brand-ink-muted text-sm">{active.role}</p>
        {characters.length > 1 && (
          <p className="text-brand-ink-muted mt-1 text-xs" aria-hidden="true">
            {activeIndex + 1} / {characters.length}
          </p>
        )}
      </div>

      {characters.length > 1 && (
        <button
          type="button"
          aria-label="Next character"
          onClick={() => onChange(nextIndex)}
          className="text-brand-ink shadow-brand-soft hover:bg-brand-blush-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
