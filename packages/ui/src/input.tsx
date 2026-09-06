'use client';

import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@za/shared';

/**
 * Field anatomy — label, input, helper/error text — per
 * docs/09-DESIGN-SYSTEM.md §7 (Forms & Inputs).
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  /** Override the label's text classes (merged with the default). */
  labelClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, errorText, labelClassName, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hasError = Boolean(errorText);
    const describedById = hasError
      ? `${inputId}-error`
      : helperText
        ? `${inputId}-helper`
        : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className={cn('text-sm font-medium text-neutral-800 dark:text-neutral-200', labelClassName)}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={hasError}
          aria-describedby={describedById}
          className={cn(
            'h-10 rounded-sm border border-neutral-300 bg-white px-3 text-base text-neutral-900 placeholder:text-neutral-400',
            'dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500',
            'focus-visible:outline-none focus-visible:border-pink-500 focus-visible:shadow-focus',
            'disabled:bg-neutral-100 disabled:text-neutral-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-600',
            hasError && 'border-danger-500 focus-visible:border-danger-500',
            className,
          )}
          {...props}
        />
        {hasError ? (
          <p id={`${inputId}-error`} className="text-xs text-danger-500">
            {errorText}
          </p>
        ) : (
          helperText && (
            <p id={`${inputId}-helper`} className="text-xs text-neutral-500 dark:text-neutral-400">
              {helperText}
            </p>
          )
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
