'use client';

import { useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@za/shared';
import { hasKeyboardFocus, usePrefersReducedMotion } from './use-autoplay';

/**
 * A link with a "peek-a-boo" hover: the cover tilts open on one side and two
 * eyes look out from underneath, their pupils following the pointer. Adapted
 * from VengeanceUI's `creepy-button` (MIT, github.com/Ashutoshx7/VengeanceUI):
 * same mechanic (tilting cover over a base, tracked pupils, a blink), rebuilt
 * as a real `<a>` (next/link) with no animation library — the tilt is a CSS
 * transition and the blink a CSS keyframe — and restyled for the ZA world:
 * a plum cover over a soft pink base, round friendly eyes instead of a
 * horror-flavored black box.
 *
 * - Mouse: the cover opens on hover and the pupils track the cursor.
 * - Touch: no tracking (there is no hover). Pressing tilts the cover
 *   slightly and the eyes look straight ahead.
 * - Keyboard: focusing the link (focus-visible) opens it, eyes centered, with
 *   the standard focus ring.
 * - prefers-reduced-motion: no tilt, no blink and the pupils stay put; the
 *   link is simply the plum pill.
 *
 * Everything is sized in `em`, so the size classes on the link (text-xs, px-4,
 * ...) scale the whole effect.
 */
export interface CreepyLinkProps {
  href: string;
  children: ReactNode;
  /** Size / spacing / entrance classes for the link (text size drives the eyes). */
  className?: string;
}

/** How far (px) the cursor can be and still move the pupils at full range. */
const VISION_RANGE_X = 180;
const VISION_RANGE_Y = 75;

export function CreepyLink({ href, children, className }: CreepyLinkProps) {
  const eyesRef = useRef<HTMLSpanElement>(null);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  function lookAt(event: PointerEvent<HTMLElement>) {
    // Only a mouse "hovers"; touch and pen skip the tracking entirely.
    if (event.pointerType !== 'mouse' || reducedMotion) return;
    const eyes = eyesRef.current;
    if (!eyes) return;
    const rect = eyes.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const angle = Math.atan2(-dy, dx) + Math.PI / 2;
    const distance = Math.hypot(dx, dy);
    setPupil({
      x:
        (Math.sin(angle) * Math.min(distance, VISION_RANGE_X)) / VISION_RANGE_X,
      y:
        (Math.cos(angle) * Math.min(distance, VISION_RANGE_Y)) / VISION_RANGE_Y,
    });
    setIsOpen(true);
  }

  function close() {
    setPupil({ x: 0, y: 0 });
    setIsOpen(false);
  }

  return (
    <Link
      href={href}
      className={cn(
        'rounded-brand-pill bg-brand-petal-300 group relative inline-block select-none outline-none',
        'focus-visible:shadow-focus',
        className,
      )}
      data-open={isOpen}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse' && !reducedMotion) setIsOpen(true);
      }}
      onPointerMove={lookAt}
      onPointerLeave={close}
      onFocus={(event) => {
        if (hasKeyboardFocus(event.currentTarget)) setIsOpen(true);
      }}
      onBlur={close}
    >
      {/* The eyes sit on the base, hidden until the cover tilts away. */}
      <span
        ref={eyesRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[0.45em] right-[0.9em] z-0 flex h-[0.8em] items-center gap-[0.35em]"
      >
        {[0, 1].map((eye) => (
          <span
            key={eye}
            data-eye
            className="bg-brand-paper animate-brand-blink relative h-full w-[0.8em] overflow-hidden rounded-full motion-reduce:animate-none"
          >
            <span
              data-pupil
              className="bg-brand-plum absolute left-1/2 top-1/2 h-[0.4em] w-[0.4em] rounded-full transition-transform duration-75 ease-out motion-reduce:transition-none"
              style={{
                transform: `translate(calc(-50% + ${pupil.x * 50}%), calc(-50% + ${pupil.y * 50}%))`,
              }}
            />
          </span>
        ))}
      </span>

      {/* The visible cover: tilts around its left end when open (hover or
          keyboard focus), or slightly while pressed (touch). */}
      <span
        className={cn(
          'rounded-brand-pill bg-brand-plum text-brand-paper shadow-brand-tight absolute inset-0 inline-flex origin-[1.25em_50%] items-center justify-center gap-[0.4em] whitespace-nowrap font-semibold',
          'transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]',
          'motion-reduce:transition-none',
          isOpen ? '-rotate-[11deg]' : 'rotate-0',
          'group-active:-rotate-6',
          'motion-reduce:rotate-0 motion-reduce:group-active:rotate-0',
        )}
      >
        {children}
      </span>

      {/* Invisible copy: gives the link the cover's size. The cover above is
          what screen readers read. */}
      <span
        aria-hidden="true"
        className="invisible inline-flex items-center justify-center gap-[0.4em] whitespace-nowrap font-semibold"
      >
        {children}
      </span>
    </Link>
  );
}
