'use client';

import { useEffect, useState } from 'react';
import { cn } from '@za/shared';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'za-theme';

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  window.localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * Light/dark toggle per docs/09-DESIGN-SYSTEM.md §10 — both apps set
 * `data-theme` on <html> via the inline script in their root layout
 * (to avoid a flash of the wrong theme); this component only handles
 * the interactive toggle after hydration.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'dark' : 'light');
  }, []);

  if (theme === null) {
    return null;
  }

  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      aria-label={`Switch to ${nextTheme} mode`}
      onClick={() => {
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition-colors hover:bg-neutral-100',
        'dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800',
        className,
      )}
    >
      <span aria-hidden="true">{theme === 'dark' ? '☾' : '☀'}</span>
    </button>
  );
}
