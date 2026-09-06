import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@za/shared';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  /** Override the label's text classes (merged with the default). */
  labelClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, errorText, labelClassName, id, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const hasError = Boolean(errorText);
    const describedById = hasError
      ? `${textareaId}-error`
      : helperText
        ? `${textareaId}-helper`
        : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className={cn('text-sm font-medium text-neutral-800 dark:text-neutral-200', labelClassName)}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={hasError}
          aria-describedby={describedById}
          className={cn(
            'rounded-sm border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 placeholder:text-neutral-400',
            'dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500',
            'focus-visible:outline-none focus-visible:border-pink-500 focus-visible:shadow-focus',
            'disabled:bg-neutral-100 disabled:text-neutral-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-600',
            hasError && 'border-danger-500 focus-visible:border-danger-500',
            className,
          )}
          {...props}
        />
        {hasError ? (
          <p id={`${textareaId}-error`} className="text-xs text-danger-500">
            {errorText}
          </p>
        ) : (
          helperText && (
            <p id={`${textareaId}-helper`} className="text-xs text-neutral-500 dark:text-neutral-400">
              {helperText}
            </p>
          )
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
