'use client';

import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@za/shared';
import {
  Cloud,
  Flower,
  MedicalDoodle,
  Sparkle,
  TwinkleStar,
} from './decorative';
import { SWIPE_SURFACE_CLASS, useSwipe } from './use-swipe';
import { hasKeyboardFocus, useAutoplay } from './use-autoplay';

interface ArtworkScene {
  id: string;
  caption: string;
  gradient: string;
}

// Four fixed decorative "scenes" built entirely from the existing brand
// decorative primitives — no real artwork assets exist yet (disclosed,
// same placeholder-art precedent as ADR 0028 §9/ADR 0029 §4). Gradient
// classes are literal strings (not interpolated) so Tailwind's JIT scanner
// can see them.
const SCENES: ArtworkScene[] = [
  {
    id: 'sparkle',
    caption: 'sparkle & shine',
    gradient: 'bg-brand-gradient-hero',
  },
  {
    id: 'bloom',
    caption: 'soft bloom',
    gradient:
      'bg-gradient-to-br from-brand-petal-100 via-brand-blush to-brand-cream',
  },
  {
    id: 'care',
    caption: 'made with care',
    gradient:
      'bg-gradient-to-br from-brand-plum-tint via-brand-blush to-brand-cream',
  },
  {
    id: 'dream',
    caption: 'dreamy & warm',
    gradient:
      'bg-gradient-to-br from-brand-lavender-tint via-brand-petal-100 to-brand-cream',
  },
];

const ROTATE_MS = 4500;

/**
 * "Rotating Artwork" — an auto-advancing carousel of purely decorative
 * illustration panels (no product data). Each scene is an abstract
 * composition in the brand's own decorative language, matching ADR 0028's
 * disclosed local-placeholder-art precedent. The scenes change by swiping or
 * dragging the panel (mouse or touch) or with the left/right arrow keys; there
 * are no buttons. Auto-rotation pauses on hover/focus and while dragging, and
 * respects `prefers-reduced-motion` (manual control only).
 */
export function RotatingArtwork() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  function goTo(next: number) {
    setIndex(((next % SCENES.length) + SCENES.length) % SCENES.length);
  }

  const { dragX, isDragging, handlers } = useSwipe((direction) =>
    goTo(index + direction),
  );

  // Restarts after every change of scene, so a swipe is followed by a full interval.
  useAutoplay({
    onAdvance: () => setIndex((current) => (current + 1) % SCENES.length),
    intervalMs: ROTATE_MS,
    paused: isPaused || isDragging,
    resetKey: index,
  });

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowLeft') goTo(index - 1);
    if (event.key === 'ArrowRight') goTo(index + 1);
  }

  const active = SCENES[index]!;

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Artwork scenes"
      tabIndex={0}
      className={cn(
        SWIPE_SURFACE_CLASS,
        'rounded-brand-xl shadow-brand-soft focus-visible:shadow-focus relative mx-auto max-w-3xl overflow-hidden focus-visible:outline-none md:cursor-grab',
        isDragging && 'cursor-grabbing',
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={(event) => {
        // Pause for keyboard focus only; a mouse press also focuses the panel.
        if (hasKeyboardFocus(event.currentTarget)) setIsPaused(true);
      }}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      {...handlers}
    >
      {/* The drag offset lives on its own wrapper: the fade-up animation on
          the scene writes a literal transform and would override it. */}
      <div
        className={cn(
          !isDragging && 'transition-transform duration-300 ease-out',
        )}
        style={{ transform: `translateX(${dragX}px)` }}
      >
        <div
          key={active.id}
          className={`relative flex h-72 items-center justify-center sm:h-80 ${active.gradient} animate-brand-fade-up`}
        >
          <div className="absolute inset-0" aria-hidden="true">
            <Sparkle className="text-brand-gold animate-brand-twinkle absolute left-[12%] top-[18%] h-6 w-6" />
            <TwinkleStar className="text-brand-paper animate-brand-float absolute right-[16%] top-[26%] h-5 w-5" />
            <Flower className="text-brand-rose animate-brand-float-slow absolute bottom-[14%] left-[18%] h-8 w-8" />
            <MedicalDoodle className="text-brand-plum absolute bottom-[20%] right-[14%] h-7 w-7" />
            <Cloud className="text-brand-paper/70 absolute right-[8%] top-[10%] h-8 w-14" />
          </div>
          <p
            aria-live="polite"
            className="font-script text-brand-berry relative text-3xl sm:text-4xl"
          >
            {active.caption}
          </p>
        </div>
      </div>

      {/* Position hint — visual only; the scenes change by swiping. */}
      <div
        className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5"
        aria-hidden="true"
      >
        {SCENES.map((scene, sceneIndex) => (
          <span
            key={scene.id}
            data-active={sceneIndex === index}
            className={`h-2 rounded-full transition-all ${sceneIndex === index ? 'bg-brand-paper w-6' : 'bg-brand-paper/50 w-2'}`}
          />
        ))}
      </div>
    </div>
  );
}
