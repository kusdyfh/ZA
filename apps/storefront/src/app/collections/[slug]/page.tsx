import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { collectionProductsQueryOptions, collectionsQueryOptions } from '@/features/collections/api';
import { buildMetadata } from '@/lib/seo';
import { CollectionContent } from './collection-content';

interface PageProps {
  params: { slug: string };
}

/** No `GET /collections/:slug` endpoint exists — collections are few and the list is unpaginated, so a slug lookup means searching the already-fetched list (a pure lookup, not fabricated data), same reasoning as categories. */
async function resolveCollection(slug: string, queryClient: QueryClient) {
  const collections = await queryClient.fetchQuery(collectionsQueryOptions());
  return collections.find((collection) => collection.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const queryClient = new QueryClient();
  const collection = await resolveCollection(params.slug, queryClient);
  if (!collection) {
    return buildMetadata({ title: 'Collection not found', path: `/collections/${params.slug}`, noIndex: true });
  }
  return buildMetadata({
    title: collection.name,
    description: collection.description ?? `Shop the ${collection.name} collection at ZA Store.`,
    path: `/collections/${params.slug}`,
  });
}

export default async function CollectionPage({ params }: PageProps) {
  const queryClient = new QueryClient();
  const collection = await resolveCollection(params.slug, queryClient);

  if (!collection) {
    notFound();
  }

  await queryClient.prefetchQuery(collectionProductsQueryOptions(collection.id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CollectionContent collection={collection} />
    </HydrationBoundary>
  );
}
