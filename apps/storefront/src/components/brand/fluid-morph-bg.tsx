'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@za/shared';
import { FLUID_MORPH_PATHS, FLUID_MORPH_VIEWBOX } from './fluid-morph-paths';
import { usePrefersReducedMotion } from './use-autoplay';

/**
 * A slowly morphing, layered "liquid" background. Adapted from VengeanceUI's
 * `fluid-morph-bg` (MIT, github.com/Ashutoshx7/VengeanceUI): seven organic
 * shapes rise from the lower left and each one breathes between two outlines.
 *
 * Rebuilt without framer-motion: the morph is the browser's own SVG animation
 * (`<animate attributeName="d">` with eased splines), so it costs no
 * JavaScript per frame. It pauses while the section is off screen, and is a
 * still picture for visitors who prefer reduced motion. Restyled for the ZA
 * world: soft pink, blush and lavender layers (translucent, so they stay a
 * backdrop for text and cards) over a pale surface.
 *
 * Purely decorative: `aria-hidden`, never intercepts the pointer. Put it as the
 * first child of a `relative isolate overflow-hidden` section.
 */
export interface FluidMorphBgProps {
  className?: string;
  /** Seconds one shape takes to morph from one outline to the other. */
  duration?: number;
  /** Fill colour of each of the seven shapes, back to front. */
  colors?: readonly string[];
  /** Opacity of each shape, back to front (0 to 1). */
  opacities?: readonly number[];
  /** Surface colour behind the shapes. */
  backgroundColor?: string;
}

/** ZA brand tokens (tailwind.config.ts): petal-100/300, lavender, blush, plum-tint, rose. */
const ZA_COLORS = [
  '#F9D6E1',
  '#CDB8F0',
  '#F6B7C8',
  '#FBEAF0',
  '#D7CAD3',
  '#E58FA7',
  '#F9D6E1',
] as const;
const ZA_OPACITIES = [0.7, 0.45, 0.4, 0.8, 0.45, 0.3, 0.85] as const;
/** brand-lavender-tint */
const ZA_SURFACE = '#E7DBF8';

/** Easing for each half of a morph (an ease-in-out curve). */
const EASE_SPLINES = '0.42 0 0.58 1;0.42 0 0.58 1';

export function FluidMorphBg({
  className,
  duration = 9,
  colors = ZA_COLORS,
  opacities = ZA_OPACITIES,
  backgroundColor = ZA_SURFACE,
}: FluidMorphBgProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Animate only while the background can be seen.
  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    if (
      !root ||
      !svg ||
      reducedMotion ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) svg.unpauseAnimations?.();
        else svg.pauseAnimations?.();
      }
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-motion={reducedMotion ? 'still' : 'morphing'}
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
      style={{ backgroundColor }}
    >
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox={FLUID_MORPH_VIEWBOX}
        focusable="false"
      >
        {FLUID_MORPH_PATHS.map(([from, to], index) => {
          // A little variance per layer keeps the motion organic, not in lockstep.
          const halfCycle = duration + (index % 3) * 0.6;
          const delay = (index % 4) * 0.25;
          return (
            <path
              key={index}
              d={from}
              fill={colors[index % colors.length]}
              fillOpacity={opacities[index % opacities.length]}
            >
              {!reducedMotion && (
                <animate
                  attributeName="d"
                  values={`${from};${to};${from}`}
                  dur={`${halfCycle * 2}s`}
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines={EASE_SPLINES}
                />
              )}
            </path>
          );
        })}
      </svg>
    </div>
  );
}
