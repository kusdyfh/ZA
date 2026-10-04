'use client';

import { useState } from 'react';
import { Breadcrumbs, Button, Drawer, Pagination } from '@za/ui';
import { SlidersHorizontal } from 'lucide-react';
import { DoodleUnderline } from '@/components/brand';
import { useProductsQuery } from '@/features/products/api';
import { ProductGrid } from '@/features/products/components/product-grid';
import { FiltersPanel } from '@/features/products/components/filters-panel';
import { useShopFilters } from '@/features/products/use-shop-filters';
import type { Category } from '@/features/categories/types';
import { BreadcrumbLink } from '@/components/breadcrumb-link';

export function CategoryContent({ category }: { category: Category }) {
  const filters = useShopFilters();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { data, isLoading, isError } = useProductsQuery({
    page: filters.page,
    limit: 20,
    search: filters.search || undefined,
    sort: filters.sort,
    categoryId: category.id,
    brandId: filters.brandId,
    colorId: filters.colorId,
    sizeId: filters.sizeId,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
  });

  return (
    <div className="bg-brand-cream dark:bg-transparent">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Breadcrumbs
          linkComponent={BreadcrumbLink}
          items={[
            { label: 'Categories', href: '/categories' },
            { label: category.name },
          ]}
          className="mb-4"
        />
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-brand-ink text-3xl font-semibold dark:text-neutral-50">
              {category.name}
            </h1>
            <DoodleUnderline className="text-brand-rose/50 mt-1 dark:text-neutral-700" />
          </div>
          <Button
            variant="outline"
            leadingIcon={<SlidersHorizontal className="h-4 w-4" />}
            onClick={() => setIsFilterDrawerOpen(true)}
            className="rounded-brand-pill border-brand-plum text-brand-plum hover:bg-brand-blush lg:hidden"
          >
            Filters
          </Button>
        </div>
        {category.description && (
          <p className="text-brand-mauve mb-6 max-w-2xl dark:text-neutral-400">
            {category.description}
          </p>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <FiltersPanel filters={filters} hideCategoryFilter />
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
                  emptyDescription="No products in this category yet."
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
          <FiltersPanel filters={filters} hideCategoryFilter />
        </Drawer>
      </div>
    </div>
  );
}
