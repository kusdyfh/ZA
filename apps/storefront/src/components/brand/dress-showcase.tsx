'use client';

import { useState } from 'react';
import type { ComponentType, SVGProps } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@za/shared';
import type { Product } from '@/features/products/types';
import { ProductCard } from '@/features/products/components/product-card';
import { PortraitBlob } from './portrait-blob';
import { Sparkle } from './decorative';

export interface DressShowcaseSlide {
  id: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: 'rose' | 'plum' | 'gold' | 'lavender';
  products: Product[];
}

export interface DressShowcaseProps {
  slides: DressShowcaseSlide[];
}

/**
 * A horizontal, center-focused "dress-up" carousel (ADR 0028 §6) — the
 * fashion-game interaction pattern extracted from the reference art's
 * dress-up tool screenshot: an active slide at full size, dimmed neighbor
 * previews on either side, arrow navigation. No interactive customization
 * (per the brief) — each slide's linked products are real, already-loaded
 * `Product`s passed in as props, rendered with the existing `ProductCard`.
 */
export function DressShowcase({ slides }: DressShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (slides.length === 0) return null;

  const prevIndex = (activeIndex - 1 + slides.length) % slides.length;
  const nextIndex = (activeIndex + 1) % slides.length;
  const active = slides[activeIndex]!;

  function goTo(index: number) {
    setActiveIndex(((index % slides.length) + slides.length) % slides.length);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-center gap-4 sm:gap-8">
        <button
          type="button"
          aria-label="Previous look"
          onClick={() => goTo(prevIndex)}
          className="bg-brand-paper text-brand-plum shadow-brand-tight hover:bg-brand-blush flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        {slides.length > 1 && (
          <button
            type="button"
            onClick={() => goTo(prevIndex)}
            aria-label={`Preview: ${slides[prevIndex]!.label}`}
            className="hidden shrink-0 opacity-40 saturate-50 transition-opacity duration-300 hover:opacity-60 sm:block"
          >
            <PortraitBlob
              icon={slides[prevIndex]!.icon}
              tone={slides[prevIndex]!.tone}
              className="h-24 w-24 scale-90"
            />
          </button>
        )}

        <div
          key={active.id}
          className="animate-brand-fade-up flex shrink-0 flex-col items-center gap-3"
        >
          <div className="relative">
            <PortraitBlob
              icon={active.icon}
              tone={active.tone}
              className="shadow-brand-glow h-40 w-40"
            />
            <Sparkle className="text-brand-gold animate-brand-twinkle absolute -right-2 -top-2 h-6 w-6" />
          </div>
          <p className="font-script text-brand-berry text-2xl">
            {active.label}
          </p>
        </div>

        {slides.length > 1 && (
          <button
            type="button"
            onClick={() => goTo(nextIndex)}
            aria-label={`Preview: ${slides[nextIndex]!.label}`}
            className="hidden shrink-0 opacity-40 saturate-50 transition-opacity duration-300 hover:opacity-60 sm:block"
          >
            <PortraitBlob
              icon={slides[nextIndex]!.icon}
              tone={slides[nextIndex]!.tone}
              className="h-24 w-24 scale-90"
            />
          </button>
        )}

        <button
          type="button"
          aria-label="Next look"
          onClick={() => goTo(nextIndex)}
          className="bg-brand-paper text-brand-plum shadow-brand-tight hover:bg-brand-blush flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {active.products.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {active.products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              className={cn('mx-auto w-full max-w-[180px]')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
