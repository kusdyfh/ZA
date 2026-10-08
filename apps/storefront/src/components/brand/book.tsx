'use client';

import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';
import { cn } from '@za/shared';
import { usePrefersReducedMotion } from './use-autoplay';

/**
 * A page-turning 3D book. Adapted from VengeanceUI's `interactive-book` (MIT,
 * github.com/Ashutoshx7/VengeanceUI): a cover that swings open, a stack of
 * sheets that flip one at a time, the spread sliding to the middle as it
 * opens. Rebuilt without framer-motion (CSS 3D transforms and transitions).
 *
 * Turning pages is the page itself, with no buttons:
 * - tap or click the right-hand page to turn forward, the left-hand page to
 *   turn back (the left page of the first spread closes the book);
 * - or drag: the sheet follows the finger or mouse and lands on whichever side
 *   it is closer to, so it can also be left half-turned and let go;
 * - the outer edge of each page lifts a little, breathing and casting a soft
 *   shadow, to show it can be turned, until the visitor has turned one.
 *
 * Without a pointer: the arrow keys and Escape work while the book has focus,
 * and keyboard-only previous/next buttons appear when tabbed to. Only the
 * faces actually showing are focusable and exposed to assistive technology.
 * Links and buttons inside pages keep working (a tap on them does not turn).
 *
 * Layout: a sheet has a `front` (right-hand page while unturned) and a `back`
 * (left-hand page once turned). Opening the cover shows `insideCover` on the
 * left and `sheets[0].front` on the right; each turn then pairs
 * `sheets[i].back` (left) with `sheets[i + 1].front` (right). Once every sheet
 * is turned the right-hand page is `endPage`.
 *
 * Motion respects prefers-reduced-motion: pages change instantly and nothing
 * nudges. Below the width of an open spread the whole book scales down to fit.
 */
export interface BookSheet {
  front: ReactNode;
  back: ReactNode;
}

export interface BookApi {
  /** Closes the book and returns to the cover. */
  restart: () => void;
}

export interface BookProps {
  cover: ReactNode;
  insideCover: ReactNode;
  sheets: BookSheet[];
  endPage: (api: BookApi) => ReactNode;
  /** Accessible name of the book. */
  label: string;
  pageWidth?: number;
  pageHeight?: number;
  className?: string;
}

/** `turned` while the book is shut; -1 is "cover open, no sheet turned yet". */
const CLOSED = -2;
/** Horizontal travel (px) before a press becomes a drag rather than a tap. */
const DRAG_START_PX = 8;
/** How much of a turn (0 to 1) a drag needs to land on the far side. */
const TURN_COMMIT = 0.3;
/** Stacked sheets sit this far (px) apart in depth so overlap never flickers. */
const SHEET_DEPTH_STEP = 0.6;
const COVER_EASE = 'cubic-bezier(0.25, 0, 0, 1)';
const SHEET_EASE = 'cubic-bezier(0.645, 0.045, 0.355, 1)';
const INTERACTIVE = 'a, button, input, select, textarea, [data-book-ignore]';

interface Drag {
  /** 1 turns the next leaf over (dragged left), -1 turns the last one back. */
  direction: 1 | -1;
  /** 0 to 1: how far the leaf has travelled. */
  progress: number;
}

interface Gesture {
  startX: number;
  startY: number;
  isOnInteractive: boolean;
  started: boolean;
}

/**
 * The inert attribute keeps a hidden face's links and buttons out of the tab
 * order. React 18 only renders it as an attribute when given a string, though
 * its types say boolean.
 */
function visibility(isShowing: boolean) {
  return isShowing
    ? {}
    : { inert: '' as unknown as boolean, 'aria-hidden': true as const };
}

export function Book({
  cover,
  insideCover,
  sheets,
  endPage,
  label,
  pageWidth = 260,
  pageHeight = 380,
  className,
}: BookProps) {
  const [turned, setTurned] = useState(CLOSED);
  const [drag, setDrag] = useState<Drag | null>(null);
  // The cover nudges until the book has been opened; the pages nudge until the
  // visitor has turned one themselves.
  const [hasOpened, setHasOpened] = useState(false);
  const [hasTurnedPage, setHasTurnedPage] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [containerWidth, setContainerWidth] = useState(pageWidth * 2);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const suppressNextClick = useRef(false);
  // Inline transitions would beat a motion-reduce class, so they are dropped here.
  const reducedMotion = usePrefersReducedMotion();
  const lastTurn = sheets.length - 1;
  const isOpen = turned > CLOSED;
  const canNext = turned < lastTurn;
  const canPrev = turned > CLOSED;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // How open the book is (0 shut, 1 spread). Dragging the cover moves it with the finger.
  const isCoverDrag =
    drag !== null &&
    ((drag.direction === 1 && turned === CLOSED) ||
      (drag.direction === -1 && turned === -1));
  const openness = isCoverDrag
    ? drag.direction === 1
      ? drag.progress
      : 1 - drag.progress
    : isOpen
      ? 1
      : 0;

  // Fit the open spread (two pages) or the closed cover into the available width.
  const fit = (needed: number) => Math.min(1, (containerWidth - 8) / needed);
  const closedScale = fit(pageWidth * 1.25);
  const openScale = fit(pageWidth * 2);
  const scale = closedScale + (openScale - closedScale) * openness;

  /** Notes what a turn from `from` in `delta` direction is, for the hints. */
  function noteUse(from: number, delta: 1 | -1) {
    if (from === CLOSED) setHasOpened(true);
    else if (!(from === -1 && delta === -1)) setHasTurnedPage(true);
  }

  function turnBy(delta: 1 | -1) {
    noteUse(turned, delta);
    setTurned((current) =>
      Math.max(CLOSED, Math.min(lastTurn, current + delta)),
    );
  }
  function close() {
    setTurned(CLOSED);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!isOpen) return;
    if (event.key === 'ArrowRight') turnBy(1);
    else if (event.key === 'ArrowLeft') turnBy(-1);
    else if (event.key === 'Escape') close();
    else return;
    event.preventDefault();
  }

  // --- Pointer: a tap turns the page under it; a drag carries the sheet. ---
  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    suppressNextClick.current = false;
    gesture.current = {
      startX: event.clientX,
      startY: event.clientY,
      isOnInteractive: Boolean((event.target as Element).closest(INTERACTIVE)),
      started: false,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (!current) return;
    const deltaX = event.clientX - current.startX;
    if (!current.started) {
      const isHorizontal =
        Math.abs(deltaX) >= DRAG_START_PX &&
        Math.abs(deltaX) > Math.abs(event.clientY - current.startY);
      if (!isHorizontal) return;
      const direction = deltaX < 0 ? 1 : -1;
      if ((direction === 1 && !canNext) || (direction === -1 && !canPrev)) {
        gesture.current = null;
        return;
      }
      current.started = true;
      noteUse(turned, direction);
      setDrag({ direction, progress: 0 });
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Capture only keeps the drag alive off the book.
      }
      return;
    }
    // A full turn takes about a page-width of travel.
    const travel = pageWidth * Math.max(scale, 0.3) * 0.9;
    const progress = Math.min(1, Math.abs(deltaX) / travel);
    setDrag((existing) => (existing ? { ...existing, progress } : existing));
  }

  function endGesture(event: PointerEvent<HTMLElement>, wasCancelled: boolean) {
    const current = gesture.current;
    gesture.current = null;
    if (!current) return;

    if (current.started) {
      // A finished drag must not also follow a link or press a button under it.
      suppressNextClick.current = true;
      if (drag && !wasCancelled && drag.progress >= TURN_COMMIT) {
        turnBy(drag.direction);
      }
      setDrag(null);
      return;
    }

    // A tap on a page (not on a link or button inside it) turns that page.
    if (wasCancelled || current.isOnInteractive || !isOpen) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const isRightHalf = event.clientX > rect.left + rect.width / 2;
    if (isRightHalf && canNext) turnBy(1);
    else if (!isRightHalf && canPrev) turnBy(-1);
  }

  function handleClickCapture(event: MouseEvent<HTMLElement>) {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    }
  }

  // --- Per-leaf look. Leaf -1 is the cover; leaves 0.. are the sheets. ---
  const draggedLeaf =
    drag === null ? null : drag.direction === 1 ? turned + 1 : turned;

  function leafAngle(leaf: number): number {
    if (drag && leaf === draggedLeaf) {
      return drag.direction === 1
        ? -180 * drag.progress
        : -180 * (1 - drag.progress);
    }
    if (leaf === -1 && turned === CLOSED && isHovering) return -14;
    return leaf <= turned ? -180 : 0;
  }
  function leafTransition(leaf: number, seconds: number, ease: string) {
    if (reducedMotion || leaf === draggedLeaf) return 'none';
    return `transform ${seconds}s ${ease}, rotate 0.3s ease-out`;
  }

  const showPageHint = isOpen && !hasTurnedPage && !reducedMotion && !drag;
  const showCoverHint = !isOpen && !hasOpened && !reducedMotion && !drag;
  const spreadNumber = turned + 2;
  const spreadCount = sheets.length + 1;

  return (
    <div
      role="group"
      aria-roledescription="book"
      aria-label={label}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        'focus-visible:shadow-focus flex flex-col items-center rounded-lg outline-none',
        className,
      )}
    >
      {/* Sizing box: its height follows the current scale. */}
      <div
        ref={containerRef}
        className="w-full"
        style={{
          height: pageHeight * scale,
          transition:
            reducedMotion || drag ? 'none' : 'height 0.7s ease-in-out',
        }}
      >
        <div
          ref={stageRef}
          className={cn(
            'relative touch-pan-y select-none',
            drag ? 'cursor-grabbing' : 'cursor-grab',
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(event) => endGesture(event, false)}
          onPointerCancel={(event) => endGesture(event, true)}
          onClickCapture={handleClickCapture}
          style={{
            width: pageWidth * 2,
            height: pageHeight,
            // Centered on the container even when it is narrower than the
            // spread (auto margins would pin it to the left edge there).
            left: '50%',
            marginLeft: -pageWidth,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            perspective: '2000px',
            transition:
              reducedMotion || drag ? 'none' : 'transform 0.7s ease-in-out',
          }}
        >
          {/* The book itself, slid right as it opens so the spread is centered. */}
          <div
            className="relative"
            style={{
              width: pageWidth,
              height: pageHeight,
              marginLeft: pageWidth / 2,
              transformStyle: 'preserve-3d',
              transform: `translateX(${(pageWidth / 2) * openness}px)`,
              transition:
                reducedMotion || isCoverDrag
                  ? 'none'
                  : `transform 1.2s ${COVER_EASE}`,
            }}
          >
            {/* Cover: a button while closed, swings open around its left edge. */}
            <div
              className={cn(
                'absolute inset-0 origin-left',
                showCoverHint && 'animate-book-lift-right',
                // On the first spread the cover is the left-hand page.
                showPageHint &&
                  turned === -1 &&
                  'animate-book-lift-left [animation-delay:1.6s]',
              )}
              style={{
                transformStyle: 'preserve-3d',
                // On top of the stack while closed; once open it lies beneath the turned sheets.
                transform: `translateZ(${turned > CLOSED ? 0 : (sheets.length + 2) * SHEET_DEPTH_STEP}px) rotateY(${leafAngle(-1)}deg)`,
                transition: leafTransition(-1, 1.2, COVER_EASE),
              }}
            >
              <div
                className="absolute inset-0 [backface-visibility:hidden]"
                {...visibility(!isOpen)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setHasOpened(true);
                    setTurned(-1);
                  }}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') setIsHovering(true);
                  }}
                  onPointerLeave={() => setIsHovering(false)}
                  aria-label={`${label}: open the book`}
                  className="focus-visible:shadow-focus absolute inset-0 block h-full w-full cursor-pointer overflow-hidden rounded-l-sm rounded-r-xl text-left outline-none"
                >
                  {cover}
                </button>
              </div>
              <div
                className="absolute inset-0 [backface-visibility:hidden]"
                style={{ transform: 'rotateY(180deg)' }}
                {...visibility(turned === -1)}
              >
                {insideCover}
              </div>
            </div>

            {/* Sheets: each turns around the spine. */}
            {sheets.map((sheet, index) => {
              const isTurned = index <= turned;
              const depth = isTurned
                ? (index + 1) * SHEET_DEPTH_STEP
                : (sheets.length - index) * SHEET_DEPTH_STEP;
              const nudge =
                showPageHint && index === turned + 1
                  ? 'animate-book-lift-right'
                  : showPageHint && index === turned
                    ? 'animate-book-lift-left [animation-delay:1.6s]'
                    : undefined;
              return (
                <div
                  key={index}
                  className={cn('absolute inset-0 origin-left', nudge)}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `translateZ(${depth}px) rotateY(${leafAngle(index)}deg)`,
                    transition: leafTransition(index, 0.7, SHEET_EASE),
                  }}
                >
                  <div
                    className="absolute inset-0 [backface-visibility:hidden]"
                    {...visibility(isOpen && index === turned + 1)}
                  >
                    {sheet.front}
                  </div>
                  <div
                    className="absolute inset-0 [backface-visibility:hidden]"
                    style={{ transform: 'rotateY(180deg)' }}
                    {...visibility(index === turned)}
                  >
                    {sheet.back}
                  </div>
                </div>
              );
            })}

            {/* The back cover: what is left once every sheet is turned. */}
            <div
              className="absolute inset-0"
              style={{ transform: 'translateZ(0px)' }}
              {...visibility(turned === lastTurn)}
            >
              {endPage({ restart: close })}
            </div>

            {/* The lifted edge of a page throws a soft shadow on the page beneath it. */}
            {showPageHint && canNext && (
              <span
                aria-hidden="true"
                data-book-lift-shadow="right"
                className="rounded-r-brand-md pointer-events-none absolute bottom-3 right-0 top-3 w-5"
                style={{
                  transform: `translateZ(${(sheets.length - (turned + 1)) * SHEET_DEPTH_STEP - SHEET_DEPTH_STEP / 2}px)`,
                  background:
                    'linear-gradient(to right, transparent, rgba(112, 64, 96, 0.22))',
                }}
              />
            )}
            {showPageHint && (
              <span
                aria-hidden="true"
                data-book-lift-shadow="left"
                className="rounded-l-brand-md pointer-events-none absolute bottom-3 top-3 w-5"
                style={{
                  left: -pageWidth,
                  transform: `translateZ(${turned >= 0 ? (turned + 1) * SHEET_DEPTH_STEP - SHEET_DEPTH_STEP / 2 : -SHEET_DEPTH_STEP / 2}px)`,
                  background:
                    'linear-gradient(to left, transparent, rgba(112, 64, 96, 0.22))',
                }}
              />
            )}
          </div>
        </div>
      </div>

      {isOpen ? (
        // For the keyboard: hidden until tabbed to, never in a pointer user's way.
        <div className="sr-only focus-within:not-sr-only focus-within:mt-4 focus-within:flex focus-within:items-center focus-within:gap-3">
          <button
            type="button"
            onClick={() => turnBy(-1)}
            className="bg-brand-paper text-brand-plum shadow-brand-tight focus-visible:shadow-focus rounded-full px-4 py-2 text-sm font-semibold outline-none"
          >
            Previous page
          </button>
          <span
            className="text-brand-mauve text-sm font-semibold"
            aria-live="polite"
          >
            {spreadNumber} / {spreadCount}
          </span>
          <button
            type="button"
            onClick={() => turnBy(1)}
            disabled={!canNext}
            className="bg-brand-paper text-brand-plum shadow-brand-tight focus-visible:shadow-focus rounded-full px-4 py-2 text-sm font-semibold outline-none disabled:opacity-40"
          >
            Next page
          </button>
        </div>
      ) : (
        <p className="font-script text-brand-berry mt-6 text-xl">
          Tap or swipe the cover to open
        </p>
      )}
    </div>
  );
}
