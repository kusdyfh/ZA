'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { usePrefersReducedMotion } from './use-autoplay';

/**
 * Scroll-linked, staggered reveal for a piece of artwork. Adapted from
 * VengeanceUI's `staggered-grid` (MIT, github.com/Ashutoshx7/VengeanceUI) and
 * Codrops' Halcyon demo: the artwork is cut into vertical strips that rise
 * from below and fade in, the middle ones first, as the visitor scrolls down
 * (and run backwards on the way up). Rebuilt without gsap, with a scroll
 * listener driving each strip's transform.
 *
 * The artwork is cut into strips rather than into characters because it is
 * Arabic lettering: splitting joined letters would break their shapes.
 *
 * With `prefers-reduced-motion`, or before scripts run, the artwork is simply
 * shown whole.
 */
export interface StaggeredRevealProps {
  src: string;
  /** What the artwork says, for screen readers. */
  alt: string;
  /** Intrinsic size of the artwork in pixels. */
  width: number;
  height: number;
  /** Source-pixel region to show (trims empty margins). */
  crop?: { x: number; y: number; width: number; height: number };
  /** `sizes` for the optimized image. */
  sizes?: string;
  /** How many strips; odd so there is a middle one. */
  strips?: number;
  className?: string;
}

/** How far (in strip-heights) a hidden strip sits below its place. */
const START_OFFSET = 1.1;
/** Extra delay, as a share of one strip's travel, for the outermost strips. */
const MAX_STAGGER = 0.8;

const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2);
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Where strip `index` of `count` is at scroll `progress` (0 to 1): how far it
 * has come (0 hidden, 1 in place). The middle strip leads, the outermost
 * trails.
 */
export function stripProgress(
  progress: number,
  index: number,
  count: number,
): number {
  const middle = (count - 1) / 2;
  const delay =
    middle === 0 ? 0 : (Math.abs(index - middle) / middle) * MAX_STAGGER;
  return easeOutSine(clamp01((progress * (1 + MAX_STAGGER) - delay) / 1));
}

/**
 * Scroll progress of an element: 0 as its top reaches the bottom of the
 * viewport, 1 once its middle reaches the middle of the viewport.
 */
export function scrollProgress(
  rect: { top: number; height: number },
  viewportHeight: number,
): number {
  const endTop = viewportHeight / 2 - rect.height / 2;
  const span = viewportHeight - endTop;
  if (span <= 0) return 1;
  return clamp01((viewportHeight - rect.top) / span);
}

export function StaggeredReveal({
  src,
  alt,
  width,
  height,
  crop = { x: 0, y: 0, width, height },
  sizes,
  strips = 9,
  className,
}: StaggeredRevealProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const wholeRef = useRef<HTMLDivElement>(null);
  const stripsRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const box = boxRef.current;
    const whole = wholeRef.current;
    const layer = stripsRef.current;
    if (!box || !whole || !layer || reducedMotion) return;
    const pieces = Array.from(
      layer.querySelectorAll<HTMLElement>('[data-reveal-strip]'),
    );

    let frame = 0;
    function update() {
      frame = 0;
      const progress = scrollProgress(
        box!.getBoundingClientRect(),
        window.innerHeight,
      );
      const isSettled = progress >= 1;
      // Settled: the single whole image, so no hairline seams between strips.
      whole!.style.opacity = isSettled ? '1' : '0';
      layer!.style.opacity = isSettled ? '0' : '1';
      pieces.forEach((piece, index) => {
        const shown = stripProgress(progress, index, pieces.length);
        piece.style.transform = `translateY(${(1 - shown) * START_OFFSET * 100}%)`;
        piece.style.opacity = String(shown);
      });
    }
    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    // Settle into the starting state without animating into it.
    const animated = [whole, layer, ...pieces];
    animated.forEach((el) => (el.style.transitionDuration = '0s'));
    update();
    const settle = window.requestAnimationFrame(() =>
      animated.forEach((el) => (el.style.transitionDuration = '')),
    );
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.cancelAnimationFrame(settle);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reducedMotion, strips]);

  const imageStyle = {
    width: `${(width / crop.width) * 100}%`,
    left: `${(-crop.x / crop.width) * 100}%`,
    top: `${(-crop.y / crop.height) * 100}%`,
  };

  return (
    <div
      ref={boxRef}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        aspectRatio: `${crop.width} / ${crop.height}`,
      }}
    >
      {/* The whole artwork: what is shown at rest, and what screen readers read. */}
      <div
        ref={wholeRef}
        className="absolute inset-0 transition-opacity duration-300"
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          className="absolute max-w-none"
          style={imageStyle}
        />
      </div>

      {/* The strips that rise into place while scrolling. Decorative copies. */}
      {!reducedMotion && (
        <div
          ref={stripsRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
        >
          {Array.from({ length: strips }, (_, index) => (
            <div
              key={index}
              data-reveal-strip=""
              className="absolute inset-y-0 overflow-hidden will-change-transform"
              style={{
                left: `${(index / strips) * 100}%`,
                width: `${100 / strips}%`,
                transition: 'transform 0.4s ease-out, opacity 0.4s ease-out',
              }}
            >
              {/* The same cropped artwork, shifted so this strip shows its own slice. */}
              <div
                className="absolute inset-y-0"
                style={{
                  width: `${strips * 100}%`,
                  left: `${-index * 100}%`,
                }}
              >
                <Image
                  src={src}
                  alt=""
                  width={width}
                  height={height}
                  sizes={sizes}
                  className="absolute max-w-none"
                  style={imageStyle}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
