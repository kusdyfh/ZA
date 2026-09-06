'use client';

import { Checkbox, Input, Select } from '@za/ui';
import { useBrandsQuery } from '@/features/brands/api';
import { useColorsQuery } from '@/features/colors/api';
import { useSizesQuery } from '@/features/sizes/api';
import type { useShopFilters } from '../use-shop-filters';

export interface FiltersPanelProps {
  filters: ReturnType<typeof useShopFilters>;
  /** Hide the category filter when a page already scopes to one category (e.g. /categories/[slug]). */
  hideCategoryFilter?: boolean;
  categoryOptions?: { value: string; label: string }[];
}

export function FiltersPanel({ filters, hideCategoryFilter, categoryOptions }: FiltersPanelProps) {
  const { data: brands } = useBrandsQuery({ limit: 100 });
  const { data: colors } = useColorsQuery({ limit: 100 });
  const { data: sizes } = useSizesQuery({ limit: 100 });

  return (
    <div className="flex flex-col gap-6">
      {!hideCategoryFilter && categoryOptions && categoryOptions.length > 0 && (
        <Select
          label="Category"
          placeholder="All categories"
          value={filters.categoryId ?? ''}
          onChange={(event) => filters.setParams({ categoryId: event.target.value })}
          options={categoryOptions}
        />
      )}

      <Select
        label="Brand"
        placeholder="All brands"
        value={filters.brandId ?? ''}
        onChange={(event) => filters.setParams({ brandId: event.target.value })}
        options={(brands?.data ?? []).map((brand) => ({ value: brand.id, label: brand.name }))}
      />

      <Select
        label="Color"
        placeholder="Any color"
        value={filters.colorId ?? ''}
        onChange={(event) => filters.setParams({ colorId: event.target.value })}
        options={(colors?.data ?? []).map((color) => ({ value: color.id, label: color.name }))}
      />

      <Select
        label="Size"
        placeholder="Any size"
        value={filters.sizeId ?? ''}
        onChange={(event) => filters.setParams({ sizeId: event.target.value })}
        options={(sizes?.data ?? []).map((size) => ({ value: size.id, label: size.label }))}
      />

      <div>
        <p className="mb-1.5 text-sm font-medium text-neutral-800 dark:text-neutral-200">Price</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            aria-label="Minimum price"
            placeholder="Min"
            defaultValue={filters.priceMin ?? ''}
            onBlur={(event) => filters.setParams({ priceMin: event.target.value })}
          />
          <span className="text-neutral-400">–</span>
          <Input
            type="number"
            min={0}
            aria-label="Maximum price"
            placeholder="Max"
            defaultValue={filters.priceMax ?? ''}
            onBlur={(event) => filters.setParams({ priceMax: event.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Checkbox
          label="Featured"
          checked={filters.isFeatured ?? false}
          onChange={(event) => filters.setParams({ isFeatured: event.target.checked ? 'true' : undefined })}
        />
        <Checkbox
          label="Best sellers"
          checked={filters.isBestSeller ?? false}
          onChange={(event) => filters.setParams({ isBestSeller: event.target.checked ? 'true' : undefined })}
        />
        <Checkbox
          label="New arrivals"
          checked={filters.isNewArrival ?? false}
          onChange={(event) => filters.setParams({ isNewArrival: event.target.checked ? 'true' : undefined })}
        />
      </div>
    </div>
  );
}
