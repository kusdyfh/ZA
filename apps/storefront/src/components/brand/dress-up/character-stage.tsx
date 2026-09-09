import { cn } from '@za/shared';
import type { Character } from '@/features/characters/types';
import { GarmentLayer } from './garment-layer';

export interface CharacterStageProps {
  character: Character;
  /** The currently selected garment asset's URL, or `undefined` to show the character's neutral base layer with no garment. */
  garmentImageUrl?: string;
  className?: string;
}

/**
 * Renders one character as a fixed stack of transparent layers, in the
 * exact order defined by the Character System spec's layer stack: hair-back
 * → body → garment (selected colour) → hair-front → accessory. The
 * character never moves or redraws when the garment changes — only
 * `GarmentLayer`'s single `<img>` swaps.
 *
 * Plain `<img>`, not `next/image`: these are decorative, non-photographic
 * illustration layers stacked by CSS position, not a single optimized
 * photo — `next/image`'s `fill` sizing model adds no value here and its
 * SVG-optimization restriction would block the placeholder assets outright.
 */
export function CharacterStage({
  character,
  garmentImageUrl,
  className,
}: CharacterStageProps) {
  return (
    <div
      className={cn(
        'rounded-brand-lg bg-brand-cream-100 shadow-brand-card relative mx-auto aspect-[5/8] w-full max-w-xs overflow-hidden',
        className,
      )}
      data-testid="character-stage"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative layered illustration, see doc comment above */}
      <img
        src={character.assets.hairBackUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-contain"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={character.assets.bodyUrl}
        alt={character.name}
        className="absolute inset-0 h-full w-full object-contain"
      />
      <GarmentLayer imageUrl={garmentImageUrl} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={character.assets.hairFrontUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-contain"
      />
      {character.accessoryUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={character.accessoryUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain"
        />
      )}
    </div>
  );
}
