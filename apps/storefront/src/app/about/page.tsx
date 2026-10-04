import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { QueryClient } from '@tanstack/react-query';
import { Heading, Text } from '@za/ui';
import { cmsPageQueryOptions } from '@/features/cms/api';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { ApiError } from '@/lib/api/client';
import { JsonLd } from '@/components/json-ld';
import { EditorialHeader } from '@/components/brand';

const SLUG = 'about';

// Prerendered at build, then regenerated in the background so admin CMS edits go live without a redeploy.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const queryClient = new QueryClient();
    const page = await queryClient.fetchQuery(cmsPageQueryOptions(SLUG));
    return buildMetadata({
      title: page.metaTitle ?? page.title,
      description: page.metaDescription ?? undefined,
      path: '/about',
      image: page.ogImageUrl ?? undefined,
    });
  } catch {
    return buildMetadata({ title: 'About Us', path: '/about' });
  }
}

export default async function AboutPage() {
  const queryClient = new QueryClient();

  try {
    const page = await queryClient.fetchQuery(cmsPageQueryOptions(SLUG));
    return (
      <div className="bg-brand-cream">
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: page.title,
            description: page.metaDescription ?? undefined,
            url: `${SITE_URL}/about`,
          }}
        />
        <EditorialHeader
          eyebrow="Our Story"
          description="The people and philosophy behind ZA Store."
        />
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <Heading
            level={2}
            as="h1"
            className="text-brand-ink dark:text-brand-ink mb-6"
          >
            {page.title}
          </Heading>
          <Text
            size="lg"
            className="text-brand-mauve dark:text-brand-mauve whitespace-pre-wrap"
          >
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
