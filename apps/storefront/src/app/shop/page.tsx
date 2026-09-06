import { Suspense } from 'react';
import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { Spinner } from '@za/ui';
import { productsQueryOptions } from '@/features/products/api';
import { buildMetadata } from '@/lib/seo';
import { ShopContent } from './shop-content';

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: 'Shop All Products',
    description: 'Browse the full ZA Store catalog — scrubs, lab coats, and accessories.',
    path: '/shop',
  });
}

export default async function ShopPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(productsQueryOptions({ page: 1, limit: 20 }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="flex justify-center py-24">
            <Spinner />
          </div>
        }
      >
        <ShopContent />
      </Suspense>
    </HydrationBoundary>
  );
}
