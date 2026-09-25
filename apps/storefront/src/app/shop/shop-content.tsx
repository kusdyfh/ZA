'use client';

import { useState } from 'react';
import { Button, Drawer, Pagination, Select } from '@za/ui';
import { SlidersHorizontal } from 'lucide-react';
import { useProductsQuery } from '@/features/products/api';
import { ProductGrid } from '@/features/products/components/product-grid';
import { FiltersPanel } from '@/features/products/components/filters-panel';
import { useShopFilters } from '@/features/products/use-shop-filters';

const SORT_OPTIONS = [
  { value: 'name:asc', label: 'Name (A–Z)' },
  { value: 'name:desc', label: 'Name (Z–A)' },
  { value: 'price:asc', label: 'Price (low to high)' },
  { value: 'price:desc', label: 'Price (high to low)' },
];

export function ShopContent() {
  const filters = useShopFilters();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { data, isLoading, isError } = useProductsQuery({
    page: filters.page,
    limit: 20,
    search: filters.search || undefined,
    sort: filters.sort,
    categoryId: filters.categoryId,
    brandId: filters.brandId,
    colorId: filters.colorId,
    sizeId: filters.sizeId,
    isFeatured: filters.isFeatured,
    isBestSeller: filters.isBestSeller,
    isNewArrival: filters.isNewArrival,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
  });

  return (
    <div className="bg-brand-cream dark:bg-transparent">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="font-display text-brand-ink text-3xl font-semibold dark:text-neutral-50">
            Shop
          </h1>
          <div className="flex items-center gap-3">
            <Select
              aria-label="Sort by"
              className="rounded-brand-md border-brand-petal-100 focus-visible:border-brand-rose w-44"
              value={filters.sort ?? ''}
              onChange={(event) =>
                filters.setParams({ sort: event.target.value }, false)
              }
              placeholder="Sort by"
              options={SORT_OPTIONS}
            />
            <Button
              variant="outline"
              leadingIcon={<SlidersHorizontal className="h-4 w-4" />}
              onClick={() => setIsFilterDrawerOpen(true)}
              className="rounded-brand-pill border-brand-plum text-brand-plum hover:bg-brand-blush lg:hidden"
            >
              Filters
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <FiltersPanel filters={filters} />
          </aside>

          <div>
            {isError ? (
              <p className="text-danger-500 text-sm">
                Something went wrong loading products. Please try again.
              </p>
            ) : (
              <>
                <ProductGrid
                  products={data?.data ?? []}
                  isLoading={isLoading}
                />
                {data && data.meta.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      page={filters.page}
                      totalPages={data.meta.totalPages}
                      limit={20}
                      onPageChange={(page) =>
                        filters.setParams({ page: String(page) }, false)
                      }
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <Drawer
          open={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          title="Filters"
          side="bottom"
          className="bg-brand-cream dark:bg-neutral-900"
          titleClassName="text-brand-ink dark:text-neutral-50"
        >
          <FiltersPanel filters={filters} />
        </Drawer>
      </div>
    </div>
  );
}
