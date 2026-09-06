import { createElement } from 'react';
import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@za/shared';

/**
 * Typography scale per docs/09-DESIGN-SYSTEM.md §3 — the display/serif
 * face for headings, the sans body face for everything else.
 */
const headingVariants = cva('font-display text-neutral-900 dark:text-neutral-50', {
  variants: {
    level: {
      1: 'text-5xl font-semibold',
      2: 'text-4xl font-semibold',
      3: 'text-3xl font-semibold',
      4: 'text-2xl font-semibold',
    },
  },
  defaultVariants: { level: 2 },
});

export interface HeadingProps
  extends HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export function Heading({ className, level = 2, as, ...props }: HeadingProps) {
  const tag = as ?? (`h${level}` as 'h1' | 'h2' | 'h3' | 'h4');
  return createElement(tag, {
    className: cn(headingVariants({ level }), className),
    ...props,
  });
}

const textVariants = cva('font-sans text-neutral-700 dark:text-neutral-300', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
    },
    muted: {
      true: 'text-neutral-500 dark:text-neutral-400',
      false: '',
    },
  },
  defaultVariants: { size: 'base', muted: false },
});

export interface TextProps
  extends HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {}

export function Text({ className, size, muted, ...props }: TextProps) {
  return <p className={cn(textVariants({ size, muted }), className)} {...props} />;
}
