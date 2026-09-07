import { cn } from '@za/shared';
import type { Color } from '@/features/colors/api';

export interface ColorSelectorProps {
  colors: Color[];
  activeColorId: string;
  onChange: (colorId: string) => void;
  className?: string;
}

/**
 * One real catalog `Color` per swatch, rendered with its actual `hexCode` —
 * selecting a swatch swaps the garment asset (see `GarmentLayer`), it never
 * recolors anything itself.
 */
export function ColorSelector({
  colors,
  activeColorId,
  onChange,
  className,
}: ColorSelectorProps) {
  if (colors.length === 0) return null;

  return (
    <div
      role="radiogroup"
      aria-label="Colour"
      className={cn('flex items-center justify-center gap-3', className)}
    >
      {colors.map((color) => {
        const isActive = color.id === activeColorId;
        return (
          <button
            key={color.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={color.name}
            onClick={() => onChange(color.id)}
            className={cn(
              'h-8 w-8 shrink-0 rounded-full border-2 transition-transform duration-200 motion-reduce:transition-none',
              isActive
                ? 'border-brand-ink shadow-brand-soft scale-110'
                : 'border-white hover:scale-105',
            )}
            style={{ backgroundColor: color.hexCode }}
          />
        );
      })}
    </div>
  );
}
