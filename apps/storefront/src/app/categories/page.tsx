import type { Metadata } from 'next';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Heading } from '@za/ui';
import { categoryTreeQueryOptions } from '@/features/categories/api';
import { buildMetadata } from '@/lib/seo';
import { CategoryTreeList } from '@/features/categories/components/category-tree-list';

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: 'Categories',
    description: 'Browse ZA Store by category.',
    path: '/categories',
  });
}

export default async function CategoriesPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(categoryTreeQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="bg-brand-cream dark:bg-transparent">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <Heading
            level={2}
            as="h1"
            className="text-brand-ink mb-6 dark:text-neutral-50"
          >
            Categories
          </Heading>
          <CategoryTreeList />
        </div>
      </div>
    </HydrationBoundary>
  );
}
