import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { QueryClient } from '@tanstack/react-query';
import { Heading, Text } from '@za/ui';
import { cmsPageQueryOptions } from '@/features/cms/api';
import { buildMetadata } from '@/lib/seo';
import { ApiError } from '@/lib/api/client';

const SLUG = 'terms-of-service';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const queryClient = new QueryClient();
    const page = await queryClient.fetchQuery(cmsPageQueryOptions(SLUG));
    return buildMetadata({
      title: page.metaTitle ?? page.title,
      description: page.metaDescription ?? undefined,
      path: '/terms-of-service',
      image: page.ogImageUrl ?? undefined,
    });
  } catch {
    return buildMetadata({
      title: 'Terms of Service',
      path: '/terms-of-service',
    });
  }
}

export default async function TermsOfServicePage() {
  const queryClient = new QueryClient();

  try {
    const page = await queryClient.fetchQuery(cmsPageQueryOptions(SLUG));
    return (
      // Brand-token skin matching the rest of the theme-aware chrome (ADR 0029 §11).
      <div className="bg-brand-cream dark:bg-transparent">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <Heading
            level={2}
            as="h1"
            className="text-brand-ink mb-6 dark:text-neutral-50"
          >
            {page.title}
          </Heading>
          <Text muted className="whitespace-pre-wrap">
            {page.content}
          </Text>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
