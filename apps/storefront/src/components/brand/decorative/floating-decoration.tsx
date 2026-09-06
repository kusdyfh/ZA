import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@za/shared';

export interface FloatingDecorationProps {
  children: ReactNode;
  className?: string;
  /** Slower, subtler float variant — for larger background shapes (clouds) vs. small sparkles. */
  speed?: 'normal' | 'slow';
  /** Stagger multiple decorations so they don't bob in lockstep. */
  delayMs?: number;
}

/**
 * Wraps any decorative primitive (Sparkle, TwinkleStar, Cloud, Flower, …) in
 * the ambient float loop from ADR 0028 §7. Not a shape itself. Fully
 * disabled under `prefers-reduced-motion` via the `animate-brand-float*`
 * utility classes' `globals.css` override.
 */
export function FloatingDecoration({ children, className, speed = 'normal', delayMs = 0 }: FloatingDecorationProps) {
  const style: CSSProperties = delayMs ? { animationDelay: `${delayMs}ms` } : {};

  return (
    <div
      className={cn(speed === 'slow' ? 'animate-brand-float-slow' : 'animate-brand-float', className)}
      style={style}
    >
      {children}
    </div>
  );
}
