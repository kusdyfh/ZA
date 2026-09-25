'use client';

import Link from 'next/link';
import { EmptyState, Skeleton } from '@za/ui';
import { useCollectionsQuery } from '@/features/collections/api';

export function CollectionsContent() {
  const { data: collections, isLoading, isError } = useCollectionsQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-danger-500 text-sm">Could not load collections.</p>
    );
  }

  if (!collections || collections.length === 0) {
    return (
      <EmptyState
        title="No collections live right now"
        description="Check back soon for new curated collections."
        className="rounded-brand-lg border-brand-petal-100 bg-brand-blush/40 dark:border-neutral-700 dark:bg-transparent"
        iconClassName="text-brand-dusty dark:text-neutral-500"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {collections.map((collection) => (
        <Link
          key={collection.id}
          href={`/collections/${collection.slug}`}
          className="rounded-brand-md border-brand-petal-100 bg-brand-paper shadow-brand-tight hover:shadow-brand-soft border p-6 transition-all duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-neutral-800 dark:bg-transparent dark:shadow-none"
        >
          <h2 className="font-display text-brand-ink text-xl font-semibold dark:text-neutral-50">
            {collection.name}
          </h2>
          {collection.description && (
            <p className="text-brand-mauve mt-2 text-sm dark:text-neutral-400">
              {collection.description}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
