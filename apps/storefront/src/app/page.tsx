import type { Metadata } from 'next';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import {
  bestSellersQueryOptions,
  featuredProductsQueryOptions,
  newArrivalsQueryOptions,
} from '@/features/products/api';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { JsonLd } from '@/components/json-ld';
import { HomeContent } from './home-content';

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: 'ZA Store — Soft, modern medical wear',
    description:
      'Premium scrubs, lab coats, and accessories — made for long shifts, designed to feel like yours.',
    path: '/',
  });
}

export default async function HomePage() {
  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery(featuredProductsQueryOptions()),
    queryClient.prefetchQuery(bestSellersQueryOptions()),
    queryClient.prefetchQuery(newArrivalsQueryOptions()),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'ZA Store',
          url: SITE_URL,
        }}
      />
      <HomeContent />
    </HydrationBoundary>
  );
}
