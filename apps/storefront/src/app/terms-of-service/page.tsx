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
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Heading level={2} as="h1" className="mb-6">
          {page.title}
        </Heading>
        <Text muted className="whitespace-pre-wrap">
          {page.content}
        </Text>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
