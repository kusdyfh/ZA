'use client';

import { useState } from 'react';
import { cn } from '@za/shared';
import type {
  Character,
  CharacterOutfitAssignment,
} from '@/features/characters/types';
import { CharacterSelector } from './character-selector';
import { CharacterStage } from './character-stage';
import { ColorSelector } from './color-selector';
import { OutfitInfo } from './outfit-info';

export interface CharacterDressUpProps {
  characters: Character[];
  /** Keyed by `Character.id` — a character with no entry yet renders on her neutral base layer with no garment/colour controls (future characters 02–10 land here without code changes). */
  outfitsByCharacterId: Record<string, CharacterOutfitAssignment>;
  className?: string;
}

/**
 * The real "ZA Styling World" dress-up component (Character System spec):
 * Character Base + Garment Layer + Selected Variant + Accessories = Final
 * Outfit, composited live in the browser. Supersedes the fixed-slide
 * `DressShowcase` on the homepage's "Try it on" section — see
 * `home-content.tsx`. `DressShowcase` itself is untouched (still a valid,
 * simpler pattern; nothing else in the app depends on this one yet).
 *
 * Desktop and mobile share one linear layout — character selector, stage,
 * colour options, outfit info — which is naturally a single column on
 * narrow viewports and centered on wide ones; no separate mobile variant
 * needed. Horizontal character-switching-by-swipe is intentionally *not*
 * hand-rolled here: with a single character today there is nothing to
 * swipe to, and the moment a second character ships this should move into
 * the same native `overflow-x-auto`/`snap-x` scroller `CharacterCarousel`
 * already uses, not custom touch-event handling.
 */
export function CharacterDressUp({
  characters,
  outfitsByCharacterId,
  className,
}: CharacterDressUpProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeColorId, setActiveColorId] = useState<string | undefined>(
    () => outfitsByCharacterId[characters[0]?.id ?? '']?.colors[0]?.id,
  );

  if (characters.length === 0) return null;
  const character = characters[activeIndex]!;
  const outfit = outfitsByCharacterId[character.id];

  function selectCharacter(index: number) {
    setActiveIndex(index);
    const nextCharacter = characters[index]!;
    setActiveColorId(outfitsByCharacterId[nextCharacter.id]?.colors[0]?.id);
  }

  const garmentImageUrl = outfit?.garmentAssets.find(
    (asset) => asset.colorId === activeColorId,
  )?.imageUrl;
  const activeColor = outfit?.colors.find(
    (color) => color.id === activeColorId,
  );

  return (
    <div
      className={cn(
        'mx-auto flex max-w-md flex-col items-center gap-6',
        className,
      )}
    >
      <CharacterSelector
        characters={characters}
        activeIndex={activeIndex}
        onChange={selectCharacter}
      />
      <CharacterStage character={character} garmentImageUrl={garmentImageUrl} />
      {outfit && (
        <>
          <ColorSelector
            colors={outfit.colors}
            activeColorId={activeColorId ?? ''}
            onChange={setActiveColorId}
          />
          <OutfitInfo product={outfit.product} activeColor={activeColor} />
        </>
      )}
    </div>
  );
}
