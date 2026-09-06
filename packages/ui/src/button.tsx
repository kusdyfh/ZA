import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@za/shared';

/**
 * Button variants/sizes/states per docs/09-DESIGN-SYSTEM.md §7 (Buttons).
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:bg-neutral-200 disabled:text-neutral-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-600',
  {
    variants: {
      variant: {
        primary: 'bg-pink-500 text-white hover:bg-pink-600 active:bg-pink-700 shadow-sm hover:shadow-md dark:bg-pink-600 dark:hover:bg-pink-500 dark:active:bg-pink-400',
        secondary: 'bg-pink-100 text-pink-800 hover:bg-pink-200 dark:bg-pink-900/40 dark:text-pink-200 dark:hover:bg-pink-900/60',
        outline: 'border border-neutral-300 bg-transparent text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800',
        ghost: 'bg-transparent text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800',
        destructive: 'bg-danger-500 text-white hover:opacity-90',
        link: 'bg-transparent text-pink-700 underline-offset-4 hover:underline dark:text-pink-300',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leadingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, isLoading = false, leadingIcon, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled ?? isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : (
          leadingIcon
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
