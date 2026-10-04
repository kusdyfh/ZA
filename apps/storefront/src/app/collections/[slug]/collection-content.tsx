'use client';

import { Breadcrumbs } from '@za/ui';
import { DoodleUnderline } from '@/components/brand';
import { useCollectionProductsQuery } from '@/features/collections/api';
import { ProductGrid } from '@/features/products/components/product-grid';
import { BreadcrumbLink } from '@/components/breadcrumb-link';
import type { Collection } from '@/features/collections/types';

export function CollectionContent({ collection }: { collection: Collection }) {
  const {
    data: products,
    isLoading,
    isError,
  } = useCollectionProductsQuery(collection.id);

  return (
    <div className="bg-brand-cream dark:bg-transparent">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Breadcrumbs
          linkComponent={BreadcrumbLink}
          items={[
            { label: 'Collections', href: '/collections' },
            { label: collection.name },
          ]}
          className="mb-4"
        />
        <h1 className="font-display text-brand-ink text-3xl font-semibold dark:text-neutral-50">
          {collection.name}
        </h1>
        <DoodleUnderline className="text-brand-rose/50 mt-1 dark:text-neutral-700" />
        {collection.description && (
          <p className="text-brand-mauve mt-2 max-w-2xl dark:text-neutral-400">
            {collection.description}
          </p>
        )}
        <div className="mt-8">
          {isError ? (
            <p className="text-danger-500 text-sm">
              Something went wrong loading products. Please try again.
            </p>
          ) : (
            <ProductGrid
              products={products ?? []}
              isLoading={isLoading}
              emptyDescription="No products in this collection yet."
            />
          )}
        </div>
      </div>
    </div>
  );
}
