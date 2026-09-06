'use client';

import { cn } from '@za/shared';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

/** Toggle switch per docs/09-DESIGN-SYSTEM.md §7 — used for isActive/isFeatured-style flags. */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <label className={cn('inline-flex items-center gap-2', disabled && 'opacity-50')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:shadow-focus',
          checked ? 'bg-pink-500' : 'bg-neutral-300 dark:bg-neutral-700',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </button>
      {label && <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>}
    </label>
  );
}
