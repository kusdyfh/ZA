import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { categoryTreeQueryOptions } from '@/features/categories/api';
import { findCategoryBySlug } from '@/features/categories/tree-utils';
import { productsQueryOptions } from '@/features/products/api';
import { buildMetadata } from '@/lib/seo';
import { CategoryContent } from './category-content';

interface PageProps {
  params: { slug: string };
}

async function resolveCategory(slug: string, queryClient: QueryClient) {
  const tree = await queryClient.fetchQuery(categoryTreeQueryOptions());
  return findCategoryBySlug(tree, slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const queryClient = new QueryClient();
  const category = await resolveCategory(params.slug, queryClient);
  if (!category) {
    return buildMetadata({ title: 'Category not found', path: `/categories/${params.slug}`, noIndex: true });
  }
  return buildMetadata({
    title: category.name,
    description: category.description ?? `Shop ${category.name} at ZA Store.`,
    path: `/categories/${params.slug}`,
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const queryClient = new QueryClient();
  const category = await resolveCategory(params.slug, queryClient);

  if (!category) {
    notFound();
  }

  await queryClient.prefetchQuery(productsQueryOptions({ page: 1, limit: 20, categoryId: category.id }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CategoryContent category={category} />
    </HydrationBoundary>
  );
}
