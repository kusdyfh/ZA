import { useEffect, useRef, useState } from 'react';

/**
 * Calls `onAdvance` every `intervalMs` for the brand carousels. It holds still
 * while `paused`, in a background tab, and for visitors who asked for reduced
 * motion (ADR 0029 §10). The countdown restarts whenever `resetKey` changes,
 * so after a manual change the next automatic one is a full interval away.
 */
export function useAutoplay({
  onAdvance,
  intervalMs,
  paused = false,
  resetKey,
}: {
  onAdvance: () => void;
  intervalMs: number;
  paused?: boolean;
  resetKey?: unknown;
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const onAdvanceRef = useRef(onAdvance);
  onAdvanceRef.current = onAdvance;

  useEffect(() => {
    // No matchMedia (very old browsers, jsdom): assume motion is fine.
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) =>
      setPrefersReducedMotion(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (paused || prefersReducedMotion) return;
    const id = window.setInterval(() => {
      if (!document.hidden) onAdvanceRef.current();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [paused, prefersReducedMotion, intervalMs, resetKey]);
}

/**
 * True when `element` has focus from the keyboard (not just a mouse press,
 * which also focuses a `tabIndex` element). Falls back to true on engines
 * without `:focus-visible`.
 */
export function hasKeyboardFocus(element: HTMLElement): boolean {
  try {
    return element.matches(':focus-visible');
  } catch {
    return true;
  }
}
