import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { Heading } from '@za/ui';
import { collectionsQueryOptions } from '@/features/collections/api';
import { buildMetadata } from '@/lib/seo';
import { CollectionsContent } from './collections-content';

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: 'Collections',
    description: "Shop ZA Store's curated collections.",
    path: '/collections',
  });
}

export default async function CollectionsPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(collectionsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Heading level={2} as="h1" className="mb-6">
          Collections
        </Heading>
        <CollectionsContent />
      </div>
    </HydrationBoundary>
  );
}
