'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CharacterCardProps } from './character-card';
import { CharacterCard } from './character-card';

export interface CharacterCarouselProps {
  characters: CharacterCardProps[];
}

/** A horizontal, scroll-snapping row of `CharacterCard`s (ADR 0028 §6). Native scroll + snap, no extra state — arrow buttons are a convenience for pointer users, not required for keyboard/touch scrolling. */
export function CharacterCarousel({ characters }: CharacterCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(amount: number) {
    scrollerRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {characters.map((character) => (
          <div key={character.name} className="snap-start">
            <CharacterCard {...character} />
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Scroll characters left"
        onClick={() => scrollBy(-240)}
        className="bg-brand-paper text-brand-plum shadow-brand-tight hover:bg-brand-blush absolute -left-4 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full p-2 sm:flex"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Scroll characters right"
        onClick={() => scrollBy(240)}
        className="bg-brand-paper text-brand-plum shadow-brand-tight hover:bg-brand-blush absolute -right-4 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full p-2 sm:flex"
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
