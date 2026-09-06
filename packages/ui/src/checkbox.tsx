import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@za/shared';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    const input = (
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded-sm border-neutral-300 text-pink-500 focus-visible:outline-none focus-visible:shadow-focus',
          'dark:border-neutral-600 dark:bg-neutral-900',
          className,
        )}
        {...props}
      />
    );

    if (!label) {
      return input;
    }

    return (
      <label htmlFor={inputId} className="inline-flex items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200">
        {input}
        {label}
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';
