import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '@za/shared';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, helperText, errorText, id, options, placeholder, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const hasError = Boolean(errorText);
    const describedById = hasError
      ? `${selectId}-error`
      : helperText
        ? `${selectId}-helper`
        : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={hasError}
          aria-describedby={describedById}
          className={cn(
            'h-10 rounded-sm border border-neutral-300 bg-white px-3 text-base text-neutral-900',
            'dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
            'focus-visible:outline-none focus-visible:border-pink-500 focus-visible:shadow-focus',
            'disabled:bg-neutral-100 disabled:text-neutral-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-600',
            hasError && 'border-danger-500 focus-visible:border-danger-500',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled={props.required}>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hasError ? (
          <p id={`${selectId}-error`} className="text-xs text-danger-500">
            {errorText}
          </p>
        ) : (
          helperText && (
            <p id={`${selectId}-helper`} className="text-xs text-neutral-500 dark:text-neutral-400">
              {helperText}
            </p>
          )
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
