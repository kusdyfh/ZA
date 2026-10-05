'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@za/shared';
import type { ProductMedia } from '../types';

const SWIPE_THRESHOLD_PX = 40;

/**
 * Media to show for the chosen color: that color's own photos plus any shared
 * (untagged) ones. A product with no color-tagged media, or a color without
 * any, falls back to the full set so the gallery is never empty.
 */
export function selectGalleryMedia(
  media: ProductMedia[],
  colorId: string | null,
): ProductMedia[] {
  const hasColorTags = media.some((item) => item.colorId);
  if (!hasColorTags) {
    return [...media].sort(
      (a, b) =>
        (b.isCover ? 1 : 0) - (a.isCover ? 1 : 0) || a.sortOrder - b.sortOrder,
    );
  }
  const forColor = media.filter(
    (item) => item.colorId === colorId || item.colorId === null,
  );
  const visible = forColor.some((item) => item.colorId === colorId)
    ? forColor
    : media;
  return [...visible].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function ProductGallery({
  media,
  productName,
  colorId = null,
}: {
  media: ProductMedia[];
  productName: string;
  colorId?: string | null;
}) {
  const items = selectGalleryMedia(media, colorId);
  // Remounting per color resets the active image and the thumbnail scroll.
  return (
    <GalleryView
      key={colorId ?? 'all'}
      items={items}
      productName={productName}
    />
  );
}

function GalleryView({
  items,
  productName,
}: {
  items: ProductMedia[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const total = items.length;
  const active = items[activeIndex];

  const go = useCallback(
    (step: number) => {
      setActiveIndex((current) => (current + step + total) % total);
    },
    [total],
  );

  useEffect(() => {
    // Scroll only the strip (not the page) so the active thumbnail stays centered.
    const strip = stripRef.current;
    const thumb = thumbRefs.current[activeIndex];
    if (!strip || !thumb) return;
    strip.scrollTo?.({
      left: thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2,
      behavior: 'smooth',
    });
  }, [activeIndex]);

  if (total === 0) {
    return (
      <div
        className="aspect-square w-full rounded-lg bg-neutral-100 dark:bg-neutral-800"
        aria-hidden="true"
      />
    );
  }

  const arrowClass =
    'absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-neutral-800 shadow-md backdrop-blur transition hover:bg-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:shadow-focus sm:opacity-0 sm:group-hover:opacity-100';

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={`${productName} photos`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (total < 2) return;
        if (event.key === 'ArrowLeft') go(-1);
        if (event.key === 'ArrowRight') go(1);
      }}
      className="focus-visible:shadow-focus rounded-lg focus-visible:outline-none"
    >
      <div
        className="group relative aspect-square w-full touch-pan-y overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          const end = event.changedTouches[0]?.clientX;
          if (total < 2 || start === null || end === undefined) return;
          const delta = end - start;
          if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) go(delta < 0 ? 1 : -1);
        }}
      >
        {active?.type === 'VIDEO' ? (
          <video
            src={active.url}
            className="h-full w-full object-cover"
            controls
            aria-label={active.altText ?? productName}
          />
        ) : (
          <Image
            key={active?.id}
            src={active?.url ?? ''}
            alt={active?.altText ?? productName}
            width={800}
            height={800}
            priority
            className="h-full w-full object-cover"
          />
        )}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className={cn(arrowClass, 'left-2')}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className={cn(arrowClass, 'right-2')}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <span
              aria-live="polite"
              className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white"
            >
              {activeIndex + 1} / {total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <div
          ref={stripRef}
          className="relative mt-3 flex gap-2 overflow-x-auto pb-1"
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                thumbRefs.current[index] = node;
              }}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1} of ${total}`}
              aria-current={index === activeIndex}
              className={cn(
                'focus-visible:shadow-focus relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition focus-visible:outline-none',
                index === activeIndex
                  ? 'border-pink-500'
                  : 'border-transparent opacity-70 hover:opacity-100',
              )}
            >
              {item.type === 'VIDEO' ? (
                <div className="flex h-full w-full items-center justify-center bg-neutral-200 text-xs dark:bg-neutral-700">
                  Video
                </div>
              ) : (
                <Image
                  src={item.url}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
