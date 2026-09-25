import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Stethoscope } from 'lucide-react';
import type { Product } from '@/features/products/types';
import { Logo } from './logo';
import { PortraitBlob } from './portrait-blob';
import {
  Cloud,
  DoodleUnderline,
  FloatingDecoration,
  Flower,
  Heart,
  PaperTape,
  Sparkle,
  Sticker,
  TwinkleStar,
} from './decorative';

export interface BrandHeroProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  /** One real, live product woven into the artwork (ADR 0029's "no fake product data" rule) — omitted gracefully while the homepage's featured-products query is still loading. */
  product?: Product;
}

/**
 * The homepage's "editorial illustrated fashion experience" hero: an
 * asymmetric split rather than a centered marketing banner, built entirely
 * from the identity system's own existing pieces (the real `Logo` asset,
 * `PortraitBlob`'s established placeholder character language, and the
 * decorative primitive set) — no new logo, palette, or component family.
 * The right-hand "scene" carries one real, live product photo pinned into
 * the composition like a tilted keepsake photo, never a fabricated preview.
 */
export function BrandHero({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  product,
}: BrandHeroProps) {
  return (
    <section className="bg-brand-cream overflow-hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:px-8 lg:py-20">
        <div className="order-2 flex flex-col items-start gap-5 lg:order-1">
          <Logo
            variant="wordmark"
            tone="fixed-light"
            className="animate-brand-fade-up h-8"
          />

          <p className="font-script text-brand-berry animate-brand-fade-up text-2xl [animation-delay:60ms] sm:text-3xl">
            wear your story{' '}
            <Heart className="inline h-5 w-5 -translate-y-0.5" filled />
          </p>

          <h1 className="font-display text-brand-ink animate-brand-fade-up text-3xl font-semibold leading-[1.1] [animation-delay:120ms] sm:text-4xl lg:text-5xl">
            {title}
          </h1>

          <DoodleUnderline className="text-brand-petal-300 animate-brand-fade-up -mt-2 [animation-delay:180ms]" />

          <p className="text-brand-mauve animate-brand-fade-up max-w-md text-lg [animation-delay:220ms]">
            {subtitle}
          </p>

          <Link
            href={ctaHref}
            className="rounded-brand-pill bg-brand-plum text-brand-paper shadow-brand-tight animate-brand-fade-up hover:bg-brand-berry mt-2 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold transition-transform duration-200 [animation-delay:280ms] hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {ctaLabel}
          </Link>
        </div>

        <div className="relative order-1 flex min-h-[380px] items-center justify-center lg:order-2 lg:min-h-[500px]">
          <div
            className="rounded-brand-xl bg-brand-gradient-hero absolute inset-4 sm:inset-8"
            aria-hidden="true"
          />

          <div
            className="rounded-brand-xl pointer-events-none absolute inset-4 overflow-hidden sm:inset-8"
            aria-hidden="true"
          >
            <FloatingDecoration
              className="absolute left-[8%] top-[10%]"
              speed="slow"
            >
              <Cloud className="h-10 w-20 text-white/50" />
            </FloatingDecoration>
            <FloatingDecoration
              className="absolute right-[12%] top-[8%]"
              delayMs={500}
            >
              <TwinkleStar className="h-6 w-6 text-white" />
            </FloatingDecoration>
            <FloatingDecoration
              className="absolute bottom-[14%] left-[10%]"
              delayMs={800}
            >
              <Flower className="text-brand-rose h-8 w-8" />
            </FloatingDecoration>
            <Sparkle className="text-brand-gold animate-brand-twinkle absolute right-[20%] top-[22%] h-5 w-5" />
            <Sparkle className="text-brand-gold animate-brand-twinkle absolute bottom-[24%] left-[24%] h-4 w-4 [animation-delay:600ms]" />
          </div>

          <div className="animate-brand-fade-up relative [animation-delay:160ms]">
            <PortraitBlob
              icon={Stethoscope}
              tone="plum"
              className="shadow-brand-soft h-44 w-44 sm:h-56 sm:w-56"
            />
          </div>

          {product?.ogImageUrl && (
            <div className="rounded-brand-lg bg-brand-paper shadow-brand-glow animate-brand-fade-up absolute bottom-[10%] right-[8%] w-32 rotate-[7deg] p-2 [animation-delay:300ms] sm:w-40">
              <PaperTape
                tone="gold"
                rotate={-10}
                className="-top-3 left-1/2 -translate-x-1/2"
              />
              <div className="rounded-brand-md relative aspect-square overflow-hidden">
                <Image
                  src={product.ogImageUrl}
                  alt={product.name}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
              <Sticker
                tone="plum"
                rotate={-3}
                className="absolute -bottom-2 -left-2"
              >
                this season
              </Sticker>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
