import { useEffect, useRef, useState } from 'react';

/** Tracks the visitor's `prefers-reduced-motion` setting (false where matchMedia is missing). */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // No matchMedia (very old browsers, jsdom): assume motion is fine.
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

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
  const prefersReducedMotion = usePrefersReducedMotion();
  const onAdvanceRef = useRef(onAdvance);
  onAdvanceRef.current = onAdvance;

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
