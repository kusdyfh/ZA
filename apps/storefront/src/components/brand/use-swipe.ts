import { useRef, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';

/** Horizontal travel (px) before a press becomes a drag rather than a tap. */
const DRAG_START_PX = 8;
/** Drag distance (px) that commits to the next/previous slide. */
const SWIPE_COMMIT_PX = 50;
/** The dragged content follows the pointer at this fraction, up to MAX_DRAG_PX. */
const DRAG_RESISTANCE = 0.6;
const MAX_DRAG_PX = 160;

/** Put on the swipe surface: vertical scrolling stays native, text is not selected mid-drag. */
export const SWIPE_SURFACE_CLASS = 'touch-pan-y select-none';

export interface SwipeHandlers {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: () => void;
  onClickCapture: (event: MouseEvent<HTMLElement>) => void;
}

export interface UseSwipeResult {
  /** Pixels to translate the slide by while a drag is in progress (0 otherwise). */
  dragX: number;
  isDragging: boolean;
  /** Spread onto the swipe surface. */
  handlers: SwipeHandlers;
}

/**
 * Pointer-driven horizontal swipe for the brand carousels (mouse and touch
 * alike). `onSwipe(1)` means "next" (the user dragged left), `onSwipe(-1)`
 * "previous". A drag shorter than the commit distance springs back; a drag
 * that starts on a link does not also follow it; vertical movement is left to
 * the browser (pair with `SWIPE_SURFACE_CLASS`).
 */
export function useSwipe(onSwipe: (direction: 1 | -1) => void): UseSwipeResult {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const suppressNextClick = useRef(false);
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  function endDrag(deltaX: number) {
    if (isDraggingRef.current) {
      if (Math.abs(deltaX) >= SWIPE_COMMIT_PX) {
        onSwipeRef.current(deltaX < 0 ? 1 : -1);
      }
      // A completed drag must not also activate a link under the pointer.
      suppressNextClick.current = true;
    }
    pointerStart.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragX(0);
  }

  const handlers: SwipeHandlers = {
    onPointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      suppressNextClick.current = false;
      pointerStart.current = { x: event.clientX, y: event.clientY };
    },
    onPointerMove(event) {
      const start = pointerStart.current;
      if (!start) return;
      const deltaX = event.clientX - start.x;
      if (!isDraggingRef.current) {
        const isHorizontal =
          Math.abs(deltaX) >= DRAG_START_PX &&
          Math.abs(deltaX) > Math.abs(event.clientY - start.y);
        if (!isHorizontal) return;
        isDraggingRef.current = true;
        setIsDragging(true);
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Capture is only a nicety (keeps the drag alive off-element).
        }
      }
      setDragX(
        Math.max(-MAX_DRAG_PX, Math.min(MAX_DRAG_PX, deltaX * DRAG_RESISTANCE)),
      );
    },
    onPointerUp(event) {
      const start = pointerStart.current;
      if (!start) return;
      endDrag(event.clientX - start.x);
    },
    onPointerCancel() {
      endDrag(0);
    },
    onClickCapture(event) {
      if (suppressNextClick.current) {
        suppressNextClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      }
    },
  };

  return { dragX, isDragging, handlers };
}
