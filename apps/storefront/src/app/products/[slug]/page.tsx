import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { productDetailQueryOptions } from '@/features/products/api';
import { productReviewsQueryOptions } from '@/features/reviews/api';
import type { ProductReviews } from '@/features/reviews/types';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/json-ld';
import { ApiError } from '@/lib/api/client';
import { ProductDetailContent } from './product-detail-content';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const queryClient = new QueryClient();
    const detail = await queryClient.fetchQuery(productDetailQueryOptions(params.slug));
    return buildMetadata({
      title: detail.product.name,
      description: detail.product.metaDescription ?? detail.product.shortDescription ?? undefined,
      path: `/products/${params.slug}`,
      image: detail.product.ogImageUrl ?? undefined,
    });
  } catch {
    return buildMetadata({ title: 'Product not found', path: `/products/${params.slug}`, noIndex: true });
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const queryClient = new QueryClient();

  try {
    const detail = await queryClient.fetchQuery(productDetailQueryOptions(params.slug));
    await queryClient.prefetchQuery(productReviewsQueryOptions(detail.product.id));

    const reviews = queryClient.getQueryData<ProductReviews>(productReviewsQueryOptions(detail.product.id).queryKey);

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: detail.product.name,
            description: detail.product.description ?? detail.product.shortDescription ?? undefined,
            image: detail.product.ogImageUrl ?? undefined,
            sku: detail.product.sku,
            offers: {
              '@type': 'Offer',
              priceCurrency: detail.product.currency,
              price: detail.product.discountPrice ?? detail.product.price,
              availability: 'https://schema.org/InStock',
            },
            ...(reviews && reviews.summary.reviewCount > 0
              ? {
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: reviews.summary.averageRating,
                    reviewCount: reviews.summary.reviewCount,
                  },
                }
              : {}),
          }}
        />
        <ProductDetailContent slug={params.slug} />
      </HydrationBoundary>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
