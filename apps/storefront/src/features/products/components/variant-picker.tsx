'use client';

import { cn } from '@za/shared';
import { useColorsQuery } from '@/features/colors/api';
import { useSizesQuery } from '@/features/sizes/api';
import type { ProductVariant } from '../types';

export interface VariantPickerProps {
  variants: ProductVariant[];
  selectedColorId: string | null;
  selectedSizeId: string | null;
  onSelectColor: (colorId: string) => void;
  onSelectSize: (sizeId: string) => void;
}

export function VariantPicker({
  variants,
  selectedColorId,
  selectedSizeId,
  onSelectColor,
  onSelectSize,
}: VariantPickerProps) {
  const { data: colors } = useColorsQuery({ limit: 100 });
  const { data: sizes } = useSizesQuery({ limit: 100 });

  const colorIds = [
    ...new Set(
      variants
        .map((variant) => variant.colorId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  // Only the chosen color's sizes are offered.
  const sizeIds = [
    ...new Set(
      variants
        .filter(
          (variant) => !selectedColorId || variant.colorId === selectedColorId,
        )
        .map((variant) => variant.sizeId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const selectedColor = colors?.data.find(
    (item) => item.id === selectedColorId,
  );

  if (colorIds.length === 0 && sizeIds.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {colorIds.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
            Color
            {selectedColor && (
              <span className="ms-2 font-normal text-neutral-500 dark:text-neutral-400">
                {selectedColor.name}
              </span>
            )}
          </p>
          <div
            role="radiogroup"
            aria-label="Color"
            className="flex flex-wrap gap-2"
          >
            {colorIds.map((colorId) => {
              const color = colors?.data.find((item) => item.id === colorId);
              const isSelected = selectedColorId === colorId;
              return (
                <button
                  key={colorId}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={color?.name ?? colorId}
                  onClick={() => onSelectColor(colorId)}
                  className={cn(
                    'focus-visible:shadow-focus h-9 w-9 rounded-full border-2 focus-visible:outline-none',
                    isSelected
                      ? 'border-pink-500'
                      : 'border-neutral-200 dark:border-neutral-700',
                  )}
                  style={{ backgroundColor: color?.hexCode ?? '#CCCCCC' }}
                />
              );
            })}
          </div>
        </div>
      )}

      {sizeIds.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
            Size
          </p>
          <div
            role="radiogroup"
            aria-label="Size"
            className="flex flex-wrap gap-2"
          >
            {sizeIds.map((sizeId) => {
              const size = sizes?.data.find((item) => item.id === sizeId);
              const isSelected = selectedSizeId === sizeId;
              return (
                <button
                  key={sizeId}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelectSize(sizeId)}
                  className={cn(
                    'focus-visible:shadow-focus rounded-full border px-4 py-1.5 text-sm font-medium focus-visible:outline-none',
                    isSelected
                      ? 'border-pink-500 bg-pink-50 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200'
                      : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800',
                  )}
                >
                  {size?.label ?? sizeId}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
