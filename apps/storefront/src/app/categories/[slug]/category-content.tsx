'use client';

import { useState } from 'react';
import { Breadcrumbs, Button, Drawer, Pagination } from '@za/ui';
import { SlidersHorizontal } from 'lucide-react';
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        linkComponent={BreadcrumbLink}
        items={[{ label: 'Categories', href: '/categories' }, { label: category.name }]}
        className="mb-4"
      />
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-neutral-900 dark:text-neutral-50">{category.name}</h1>
        <Button variant="outline" leadingIcon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setIsFilterDrawerOpen(true)} className="lg:hidden">
          Filters
        </Button>
      </div>
      {category.description && <p className="mb-6 max-w-2xl text-neutral-600 dark:text-neutral-400">{category.description}</p>}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <FiltersPanel filters={filters} hideCategoryFilter />
        </aside>
        <div>
          {isError ? (
            <p className="text-sm text-danger-500">Something went wrong loading products. Please try again.</p>
          ) : (
            <>
              <ProductGrid products={data?.data ?? []} isLoading={isLoading} emptyDescription="No products in this category yet." />
              {data && data.meta.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    page={filters.page}
                    totalPages={data.meta.totalPages}
                    limit={20}
                    onPageChange={(page) => filters.setParams({ page: String(page) }, false)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Drawer open={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} title="Filters" side="bottom">
        <FiltersPanel filters={filters} hideCategoryFilter />
      </Drawer>
    </div>
  );
}
