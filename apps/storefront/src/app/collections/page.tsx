import type { Metadata } from 'next';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Heading } from '@za/ui';
import { DoodleUnderline } from '@/components/brand';
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
      <div className="bg-brand-cream dark:bg-transparent">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Heading
            level={2}
            as="h1"
            className="text-brand-ink dark:text-neutral-50"
          >
            Collections
          </Heading>
          <DoodleUnderline className="text-brand-rose/50 mb-6 mt-1 dark:text-neutral-700" />
          <CollectionsContent />
        </div>
      </div>
    </HydrationBoundary>
  );
}
