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
    return <p className="text-sm text-danger-500">Could not load collections.</p>;
  }

  if (!collections || collections.length === 0) {
    return <EmptyState title="No collections live right now" description="Check back soon for new curated collections." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {collections.map((collection) => (
        <Link
          key={collection.id}
          href={`/collections/${collection.slug}`}
          className="rounded-lg border border-neutral-200 p-6 transition-shadow hover:shadow-md dark:border-neutral-800"
        >
          <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-50">{collection.name}</h2>
          {collection.description && (
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{collection.description}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
