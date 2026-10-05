'use client';

import { cn } from '@za/shared';
import type { CharacterCardProps } from './character-card';
import { CharacterCard } from './character-card';
import { useDragScroll } from './use-drag-scroll';

export interface CharacterCarouselProps {
  characters: CharacterCardProps[];
}

/**
 * A horizontal, scroll-snapping row of `CharacterCard`s (ADR 0028 §6). It is
 * moved by dragging: touch uses the browser's own swipe scrolling, and the
 * mouse gets click-and-drag (`useDragScroll`). The wheel and the keyboard
 * (tabbing to a card brings it into view) still scroll it too. The cards run
 * past the container's edge, which is what hints that there is more.
 */
export function CharacterCarousel({ characters }: CharacterCarouselProps) {
  const { ref, isDragging, handlers } = useDragScroll<HTMLDivElement>();

  return (
    <div
      ref={ref}
      {...handlers}
      className={cn(
        'flex gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] md:cursor-grab [&::-webkit-scrollbar]:hidden',
        // Snapping and smooth scrolling are off mid-drag so the row tracks the
        // pointer, then back on so it settles on a card.
        isDragging
          ? 'cursor-grabbing snap-none scroll-auto'
          : 'snap-x snap-mandatory scroll-smooth',
      )}
    >
      {characters.map((character) => (
        <div key={character.name} className="snap-start">
          <CharacterCard {...character} />
        </div>
      ))}
    </div>
  );
}
