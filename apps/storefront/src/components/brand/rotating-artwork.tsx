'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Cloud,
  Flower,
  MedicalDoodle,
  Sparkle,
  TwinkleStar,
} from './decorative';

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
 * disclosed local-placeholder-art precedent. Auto-rotation pauses on
 * hover/focus and respects `prefers-reduced-motion` (manual controls only).
 */
export function RotatingArtwork() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
  }, []);

  useEffect(() => {
    if (isPaused || reducedMotionRef.current) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % SCENES.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [isPaused]);

  function goTo(next: number) {
    setIndex(((next % SCENES.length) + SCENES.length) % SCENES.length);
  }

  const active = SCENES[index]!;

  return (
    <div
      className="rounded-brand-xl shadow-brand-soft relative mx-auto max-w-3xl overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
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
        <p className="font-script text-brand-berry relative text-3xl sm:text-4xl">
          {active.caption}
        </p>
      </div>

      <button
        type="button"
        aria-label="Previous artwork"
        onClick={() => goTo(index - 1)}
        className="bg-brand-paper/90 text-brand-plum shadow-brand-tight hover:bg-brand-paper absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Next artwork"
        onClick={() => goTo(index + 1)}
        className="bg-brand-paper/90 text-brand-plum shadow-brand-tight hover:bg-brand-paper absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>

      <div
        className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5"
        role="tablist"
        aria-label="Artwork scenes"
      >
        {SCENES.map((scene, sceneIndex) => (
          <button
            key={scene.id}
            type="button"
            role="tab"
            aria-selected={sceneIndex === index}
            aria-label={`Show ${scene.caption} artwork`}
            onClick={() => goTo(sceneIndex)}
            className={`h-2 rounded-full transition-all ${sceneIndex === index ? 'bg-brand-paper w-6' : 'bg-brand-paper/50 w-2'}`}
          />
        ))}
      </div>
    </div>
  );
}
