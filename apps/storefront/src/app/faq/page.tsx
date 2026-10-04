import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { QueryClient } from '@tanstack/react-query';
import { Accordion, Heading } from '@za/ui';
import { cmsPageQueryOptions } from '@/features/cms/api';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/json-ld';
import { ApiError } from '@/lib/api/client';
import { EditorialHeader } from '@/components/brand';

const SLUG = 'faq';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const queryClient = new QueryClient();
    const page = await queryClient.fetchQuery(cmsPageQueryOptions(SLUG));
    return buildMetadata({
      title: page.metaTitle ?? page.title,
      description:
        page.metaDescription ??
        'Answers to common questions about shipping, returns, payment, and sizing.',
      path: '/faq',
      image: page.ogImageUrl ?? undefined,
    });
  } catch {
    return buildMetadata({ title: 'Frequently Asked Questions', path: '/faq' });
  }
}

export default async function FaqPage() {
  const queryClient = new QueryClient();

  try {
    const page = await queryClient.fetchQuery(cmsPageQueryOptions(SLUG));
    const faqs = page.faqItems ?? [];

    return (
      <div className="bg-brand-cream">
        {faqs.length > 0 && (
          <JsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
              })),
            }}
          />
        )}
        <EditorialHeader
          eyebrow="Questions?"
          description="Answers about shipping, sizing, returns, and everything in between."
        />
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <Heading
            level={2}
            as="h1"
            className="text-brand-ink dark:text-brand-ink mb-6"
          >
            {page.title}
          </Heading>
          <Accordion
            items={faqs.map((faq, index) => ({
              key: `${index}-${faq.question}`,
              title: faq.question,
              content: <p>{faq.answer}</p>,
            }))}
            className="divide-brand-petal-100 dark:divide-brand-petal-100"
            buttonClassName="text-brand-ink hover:text-brand-plum dark:text-brand-ink dark:hover:text-brand-plum"
            panelClassName="text-brand-mauve dark:text-brand-mauve"
          />
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
