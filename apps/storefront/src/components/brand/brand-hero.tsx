'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { Product } from '@/features/products/types';
import { Logo } from './logo';
import {
  Bow,
  Cloud,
  DoodleUnderline,
  FloatingDecoration,
  Flower,
  Heart,
  PaperTape,
  SectionWave,
  Sparkle,
  TwinkleStar,
} from './decorative';

export interface BrandHeroProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  /** One real, live product woven into the scene (ADR 0029's "no fake product data" rule) — omitted gracefully while the homepage's featured-products query is still loading. */
  product?: Product;
}

/**
 * Three outfit-styling variants of the same character (same face/identity,
 * generated via image-to-image from the same reference so she stays
 * recognizable) — the client asked for "more than one character... with
 * different styles" and a way to slide between them, rather than a single
 * static hero image.
 */
const HERO_CHARACTERS = [
  { id: 'plum', src: '/brand/za-girl-plum.png', label: 'Classic plum scrubs' },
  {
    id: 'rose',
    src: '/brand/za-girl-rose.png',
    label: 'Rose scrubs, hair down',
  },
  {
    id: 'labcoat',
    src: '/brand/za-girl-labcoat.png',
    label: 'Lab coat over scrubs',
  },
] as const;

/**
 * The homepage's first viewport as one illustrated "ZA Pink Cartoon World"
 * scene: the character stands grounded in a full-bleed environment (no
 * card, no frame around her — she IS the scene, not a photo pinned to
 * one), with a real product tagged near her hand, a short headline label
 * floating above her rather than a text column beside her, and the
 * decorative primitive set (flowers, hearts, stars, clouds, a ribbon bow)
 * scattered through the space to make the world feel cohesive. The
 * background went through two real iterations before landing here: first
 * a flat CSS gradient, then a Canva-generated painted sky image (both
 * replaced on direct client feedback — see CHANGELOG Epic 14.2/14.4) —
 * it's now `.brand-pattern-low` (globals.css, ADR 0029 §14), the site's
 * own repeating brand-monogram tile, per the client's request for a
 * background that's "integrated with the site" rather than a standalone
 * picture. `SectionWave` turns the hand-off into the next section into a
 * soft ground line instead of a hard color cut (z-[5], below the
 * character's z-10, so she always stands in front of it).
 *
 * NOTE: `animate-brand-fade-up`'s keyframe sets a literal `transform:
 * translateY(...)`, which silently overrides any static `rotate-*` /
 * `translate-x-*` utility placed on the *same* element (confirmed live —
 * an early pass had the whole character wrapper rendering unrotated and
 * off-center because of this). Every rotated/centered piece below is
 * therefore split into an outer wrapper that owns the static transform and
 * an inner element that owns the animation, never both on one node.
 */
export function BrandHero({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  product,
}: BrandHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = HERO_CHARACTERS[activeIndex]!;

  function goTo(index: number) {
    setActiveIndex(
      ((index % HERO_CHARACTERS.length) + HERO_CHARACTERS.length) %
        HERO_CHARACTERS.length,
    );
  }

  return (
    <section className="brand-pattern-low relative isolate min-h-[80dvh] overflow-hidden sm:min-h-[84vh] lg:max-h-[900px] lg:min-h-[90vh]">
      {/* `.brand-pattern-low` (globals.css, ADR 0029 §14) — the site's own
          repeating ZA-monogram/sparkle/heart/ribbon tile at 4.5% opacity on
          brand-cream, defined for exactly this ("site section backgrounds")
          but never actually applied anywhere until now. Replaces the
          generated gradient-sky image: no external asset, no gradient —
          a real piece of the design system instead, per the client's
          request for something "integrated with the site" rather than a
          standalone picture. The CTA sits in its own opaque brand-plum
          pill so the pattern never shows through it; the headline is
          plain dark ink directly on the 4.5%-opacity tile, which reads as
          paper texture, not a competing visual (ADR's "never behind body
          text or a CTA" rule is about density/contrast, not a ban on this
          low tier under text generally — kept well within that intent). */}

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <FloatingDecoration
          className="absolute -left-[4%] top-[6%]"
          speed="slow"
        >
          <Cloud className="text-brand-paper/80 h-9 w-16 sm:h-12 sm:w-24" />
        </FloatingDecoration>
        <FloatingDecoration
          className="absolute right-[8%] top-[8%]"
          delayMs={400}
        >
          <TwinkleStar className="text-brand-gold h-6 w-6 sm:h-8 sm:w-8" />
        </FloatingDecoration>
        <FloatingDecoration
          className="absolute left-[10%] top-[30%]"
          delayMs={650}
          speed="slow"
        >
          <Sparkle className="animate-brand-twinkle text-brand-gold h-6 w-6 sm:h-7 sm:w-7" />
        </FloatingDecoration>
        <FloatingDecoration
          className="absolute right-[12%] top-[42%]"
          delayMs={900}
        >
          <Heart className="text-brand-rose h-6 w-6 sm:h-8 sm:w-8" filled />
        </FloatingDecoration>
        <FloatingDecoration
          className="absolute bottom-[16%] left-[6%]"
          delayMs={500}
          speed="slow"
        >
          <Flower className="text-brand-rose h-9 w-9 sm:h-11 sm:w-11" />
        </FloatingDecoration>
        <FloatingDecoration
          className="absolute bottom-[10%] right-[6%]"
          delayMs={1100}
        >
          <Bow className="text-brand-plum h-8 w-12 sm:h-10 sm:w-16" />
        </FloatingDecoration>
        <Sparkle className="animate-brand-twinkle text-brand-gold absolute left-[30%] top-[14%] h-4 w-4 [animation-delay:300ms]" />
        <Sparkle className="animate-brand-twinkle text-brand-gold absolute bottom-[26%] right-[28%] h-4 w-4 [animation-delay:800ms]" />
      </div>

      <SectionWave className="z-[5] h-10 sm:h-14 lg:h-16" tone="cream" />

      {/* Positioning wrapper (no animation) > animated fill (no static transform). */}
      <div
        className="absolute left-4 top-4 z-30 sm:left-6 sm:top-6 lg:left-10 lg:top-8"
        aria-hidden="true"
      >
        <div className="animate-brand-fade-up">
          <Logo
            variant="compact"
            tone="fixed-light"
            className="shadow-brand-tight"
          />
        </div>
      </div>

      {/* The headline floats above her as a short, rotated label — not a
          text column standing beside the artwork. Rotation lives on this
          outer wrapper; the animation lives on the inner block. */}
      <div className="absolute left-[8%] top-[16%] z-20 max-w-[80%] -rotate-1 sm:top-[13%] sm:max-w-[70%] lg:left-[10%] lg:top-[16%] lg:max-w-[36%]">
        <div className="animate-brand-fade-up">
          <h1 className="font-display text-brand-ink text-4xl font-semibold leading-[0.95] sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="sr-only">{subtitle}</p>
          <DoodleUnderline className="text-brand-berry/60 ml-1 mt-2" />
        </div>
      </div>

      {/* She stands grounded at the base of the scene — the clear visual
          anchor, not a photo pinned inside a card. Centering (-translate-x-1/2)
          lives on this outer wrapper; the entrance animation lives on the
          inner fill so the two transforms never collide.
          Painted illustrations generated via Canva (image-to-image, same
          face/identity across all three so she stays recognizable — only
          outfit/hairstyle differ), background removed for compositing.
          Exported at native 1024×1536 resolution by placing each generated
          asset onto a full-size Canva design page and exporting that page
          directly, after `get-assets` only ever returned a 133×200
          thumbnail. `key={active.id}` retriggers the fade-up entrance on
          every slide change, matching `DressShowcase`'s carousel pattern. */}
      <div className="absolute bottom-0 left-1/2 z-10 h-[300px] w-[199px] -translate-x-1/2 sm:h-[380px] sm:w-[253px] lg:left-[54%] lg:h-[560px] lg:w-[372px]">
        <div
          key={active.id}
          className="animate-brand-fade-up relative h-full w-full [animation-delay:120ms]"
        >
          <Image
            src={active.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 372px, (min-width: 640px) 253px, 199px"
            className="animate-brand-float-slow object-contain object-bottom drop-shadow-[0_18px_28px_rgba(112,64,96,0.22)]"
            priority
          />
        </div>

        {/* Carousel controls — same circular-arrow pattern as `DressShowcase`
            (bg-brand-paper / text-brand-plum / shadow-brand-tight), placed
            near her shoulders (top-[18%]) so they clear the product tag
            (top-[46%]) and the CTA (bottom) rather than colliding with either. */}
        <button
          type="button"
          aria-label={`Previous look: ${HERO_CHARACTERS[(activeIndex - 1 + HERO_CHARACTERS.length) % HERO_CHARACTERS.length]!.label}`}
          onClick={() => goTo(activeIndex - 1)}
          className="bg-brand-paper text-brand-plum shadow-brand-tight hover:bg-brand-blush absolute -left-9 top-[18%] z-20 flex h-8 w-8 items-center justify-center rounded-full sm:-left-11 sm:h-9 sm:w-9"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`Next look: ${HERO_CHARACTERS[(activeIndex + 1) % HERO_CHARACTERS.length]!.label}`}
          onClick={() => goTo(activeIndex + 1)}
          className="bg-brand-paper text-brand-plum shadow-brand-tight hover:bg-brand-blush absolute -right-9 top-[18%] z-20 flex h-8 w-8 items-center justify-center rounded-full sm:-right-11 sm:h-9 sm:w-9"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </button>

        {product?.ogImageUrl && (
          <div className="absolute left-[-18%] top-[46%] w-16 -rotate-[10deg] sm:w-20 lg:w-28">
            <div className="animate-brand-fade-up rounded-brand-lg bg-brand-paper shadow-brand-glow p-1.5 [animation-delay:320ms]">
              <PaperTape
                tone="gold"
                rotate={10}
                className="-top-2 left-1/2 -translate-x-1/2"
              />
              <div className="rounded-brand-md relative aspect-square overflow-hidden">
                <Image
                  src={product.ogImageUrl}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 112px, 80px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-[-6%] z-20 rotate-[4deg] sm:bottom-4 lg:bottom-6">
          <Link
            href={ctaHref}
            className="animate-brand-fade-up rounded-brand-pill bg-brand-plum text-brand-paper shadow-brand-tight inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold [animation-delay:240ms] sm:text-sm lg:px-6 lg:py-3 lg:text-base"
          >
            <Sparkles
              className="h-3.5 w-3.5 lg:h-4 lg:w-4"
              aria-hidden="true"
            />
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
