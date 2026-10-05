'use client';

import { useState } from 'react';
import type { ComponentType, KeyboardEvent, SVGProps } from 'react';
import { cn } from '@za/shared';
import type { Product } from '@/features/products/types';
import { ProductCard } from '@/features/products/components/product-card';
import { PortraitBlob } from './portrait-blob';
import { Sparkle } from './decorative';
import { SWIPE_SURFACE_CLASS, useSwipe } from './use-swipe';

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
 * dress-up tool screenshot: an active slide at full size with dimmed
 * neighbor previews on either side. The looks change by swiping/dragging
 * the portrait row (mouse or touch) or with the left/right arrow keys; there
 * are no buttons. No interactive customization (per the brief) — each
 * slide's linked products are real, already-loaded `Product`s passed in as
 * props, rendered with the existing `ProductCard`.
 */
export function DressShowcase({ slides }: DressShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  function goTo(index: number) {
    setActiveIndex(((index % slides.length) + slides.length) % slides.length);
  }

  const { dragX, isDragging, handlers } = useSwipe((direction) =>
    goTo(activeIndex + direction),
  );

  if (slides.length === 0) return null;

  const prevIndex = (activeIndex - 1 + slides.length) % slides.length;
  const nextIndex = (activeIndex + 1) % slides.length;
  const active = slides[activeIndex]!;

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (slides.length < 2) return;
    if (event.key === 'ArrowLeft') goTo(activeIndex - 1);
    if (event.key === 'ArrowRight') goTo(activeIndex + 1);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Looks"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        {...handlers}
        className={cn(
          SWIPE_SURFACE_CLASS,
          'focus-visible:shadow-focus rounded-brand-lg py-2 focus-visible:outline-none',
          slides.length > 1 && 'md:cursor-grab',
          isDragging && 'cursor-grabbing',
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center gap-4 sm:gap-8',
            !isDragging && 'transition-transform duration-300 ease-out',
          )}
          style={{ transform: `translateX(${dragX}px)` }}
        >
          {slides.length > 1 && (
            <div
              aria-hidden="true"
              className="hidden shrink-0 opacity-40 saturate-50 sm:block"
            >
              <PortraitBlob
                icon={slides[prevIndex]!.icon}
                tone={slides[prevIndex]!.tone}
                className="h-24 w-24 scale-90"
              />
            </div>
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
            <p
              aria-live="polite"
              className="font-script text-brand-berry text-2xl"
            >
              {active.label}
            </p>
          </div>

          {slides.length > 1 && (
            <div
              aria-hidden="true"
              className="hidden shrink-0 opacity-40 saturate-50 sm:block"
            >
              <PortraitBlob
                icon={slides[nextIndex]!.icon}
                tone={slides[nextIndex]!.tone}
                className="h-24 w-24 scale-90"
              />
            </div>
          )}
        </div>

        {/* Position hint — visual only; the looks change by swiping. */}
        {slides.length > 1 && (
          <div
            className="pointer-events-none mt-4 flex justify-center gap-1.5"
            aria-hidden="true"
          >
            {slides.map((slide, index) => (
              <span
                key={slide.id}
                data-active={index === activeIndex}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  index === activeIndex
                    ? 'bg-brand-plum w-5'
                    : 'bg-brand-petal-300 w-1.5',
                )}
              />
            ))}
          </div>
        )}
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
