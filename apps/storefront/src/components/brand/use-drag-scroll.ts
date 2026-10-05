import { useRef, useState } from 'react';
import type { DragEvent, MouseEvent, PointerEvent } from 'react';

/** Horizontal travel (px) before a mouse press becomes a drag rather than a click. */
const DRAG_START_PX = 6;

/**
 * Click-and-drag scrolling for a native `overflow-x` row. Touch already
 * scrolls such a row by swiping, so only the mouse is handled here. While
 * dragging, the caller should switch off scroll snapping and smooth scrolling
 * (`isDragging`) so the row tracks the pointer, then turn them back on so it
 * settles on a card. A drag does not also click the card under the pointer.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isDragging, setIsDragging] = useState(false);
  const drag = useRef({
    startX: 0,
    startScroll: 0,
    isPressed: false,
    moved: false,
  });
  const suppressNextClick = useRef(false);

  function finish() {
    if (drag.current.moved) suppressNextClick.current = true;
    drag.current.isPressed = false;
    drag.current.moved = false;
    setIsDragging(false);
  }

  const handlers = {
    onPointerDown(event: PointerEvent<T>) {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      suppressNextClick.current = false;
      drag.current = {
        startX: event.clientX,
        startScroll: ref.current?.scrollLeft ?? 0,
        isPressed: true,
        moved: false,
      };
    },
    onPointerMove(event: PointerEvent<T>) {
      const state = drag.current;
      const element = ref.current;
      if (!state.isPressed || !element) return;
      const deltaX = event.clientX - state.startX;
      if (!state.moved) {
        if (Math.abs(deltaX) < DRAG_START_PX) return;
        state.moved = true;
        setIsDragging(true);
        try {
          element.setPointerCapture(event.pointerId);
        } catch {
          // Capture is only a nicety (keeps the drag alive off-element).
        }
      }
      element.scrollLeft = state.startScroll - deltaX;
    },
    onPointerUp: finish,
    onPointerCancel: finish,
    onClickCapture(event: MouseEvent<T>) {
      if (suppressNextClick.current) {
        suppressNextClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      }
    },
    // Without this the browser starts a native drag of the link under the pointer.
    onDragStart(event: DragEvent<T>) {
      event.preventDefault();
    },
  };

  return { ref, isDragging, handlers };
}
