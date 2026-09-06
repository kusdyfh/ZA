'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@za/shared';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
}

/** Cart line-item and PDP "add to cart" quantity control. */
export function QuantityStepper({ value, onChange, min = 1, max = 99, disabled, label = 'Quantity' }: QuantityStepperProps) {
  function decrement() {
    if (value > min) onChange(value - 1);
  }

  function increment() {
    if (value < max) onChange(value + 1);
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex items-center rounded-sm border border-neutral-300 dark:border-neutral-700',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={decrement}
        disabled={disabled || value <= min}
        className="flex h-9 w-9 items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span className="w-8 text-center text-sm font-medium text-neutral-900 dark:text-neutral-100" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={increment}
        disabled={disabled || value >= max}
        className="flex h-9 w-9 items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
