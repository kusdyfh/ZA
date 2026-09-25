import { EmptyState, Skeleton } from '@za/ui';
import type { Product } from '../types';
import { ProductCard } from './product-card';

export interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  skeletonCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ProductGrid({
  products,
  isLoading = false,
  skeletonCount = 8,
  emptyTitle = 'No products found',
  emptyDescription = 'Try adjusting your search or filters.',
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index}>
            <Skeleton className="rounded-brand-md bg-brand-blush aspect-square w-full dark:bg-neutral-800" />
            <Skeleton className="bg-brand-blush mt-3 h-4 w-3/4 dark:bg-neutral-800" />
            <Skeleton className="bg-brand-blush mt-2 h-4 w-1/3 dark:bg-neutral-800" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className="rounded-brand-lg border-brand-petal-100 bg-brand-blush/40 dark:border-neutral-700 dark:bg-transparent"
        iconClassName="text-brand-dusty dark:text-neutral-500"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
