'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@za/shared';

/**
 * Slide-in panel per docs/09-DESIGN-SYSTEM.md §7 (Dialogs) — "drawer
 * for a task" (cart, mobile filter panel, mobile nav): extends the
 * page rather than interrupting it. Slides from the end (right in LTR)
 * on desktop and from the bottom on mobile, matching the design
 * system's storefront-drawer convention. Same focus-trap/Escape/
 * backdrop behavior as `Dialog`.
 */
export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** `start` slides in from the leading edge (left in LTR) — for a menu opened from a left-hand trigger. */
  side?: 'start' | 'end' | 'bottom';
  /** Override the panel's container classes (merged with the default). */
  className?: string;
  /** Override the header title's classes (merged with the default). */
  titleClassName?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = 'end',
  className,
  titleClassName,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocused.current = document.activeElement as HTMLElement;
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-neutral-900/50"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
        className={cn(
          'relative z-10 flex flex-col bg-white shadow-lg outline-none dark:bg-neutral-900',
          side === 'start' && 'me-auto h-full w-full max-w-sm',
          side === 'end' && 'ms-auto h-full w-full max-w-md',
          side === 'bottom' && 'mt-auto max-h-[85vh] w-full rounded-t-lg',
          className,
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-neutral-200 p-4 dark:border-neutral-800">
          <h2
            id="drawer-title"
            className={cn(
              'font-display text-lg font-semibold text-neutral-900 dark:text-neutral-50',
              titleClassName,
            )}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && (
          <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
