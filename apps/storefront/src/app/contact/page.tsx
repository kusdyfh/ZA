import type { Metadata } from 'next';
import { Mail, MapPin, Phone } from 'lucide-react';
import { QueryClient } from '@tanstack/react-query';
import { Heading, Text } from '@za/ui';
import { cmsPageQueryOptions } from '@/features/cms/api';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { JsonLd } from '@/components/json-ld';
import { EditorialHeader } from '@/components/brand';
import { ContactForm } from './contact-form';

const SLUG = 'contact';

// This page falls back to static copy when the CMS is unreachable; without revalidation a build-time outage would freeze that fallback.
export const revalidate = 300;
const FALLBACK_INTRO =
  'Have a question about an order, sizing, or anything else? Send us a message and we’ll get back to you.';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const queryClient = new QueryClient();
    const page = await queryClient.fetchQuery(cmsPageQueryOptions(SLUG));
    return buildMetadata({
      title: page.metaTitle ?? page.title,
      description: page.metaDescription ?? undefined,
      path: '/contact',
      image: page.ogImageUrl ?? undefined,
    });
  } catch {
    return buildMetadata({ title: 'Contact Us', path: '/contact' });
  }
}

export default async function ContactPage() {
  const queryClient = new QueryClient();
  let title = 'Contact us';
  let intro: string = FALLBACK_INTRO;

  try {
    const page = await queryClient.fetchQuery(cmsPageQueryOptions(SLUG));
    title = page.title;
    intro = page.content || FALLBACK_INTRO;
  } catch {
    // Contact form itself has no CMS dependency — page still works with fallback copy.
  }

  return (
    <div className="bg-brand-cream">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: title,
          url: `${SITE_URL}/contact`,
        }}
      />
      <EditorialHeader
        eyebrow="Say Hello"
        description="Questions about an order, sizing, or anything else — we'd love to hear from you."
      />
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <Heading
          level={2}
          as="h1"
          className="text-brand-ink dark:text-brand-ink mb-6"
        >
          {title}
        </Heading>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <Text
              size="lg"
              className="text-brand-mauve dark:text-brand-mauve mb-6 whitespace-pre-wrap"
            >
              {intro}
            </Text>
            <div className="text-brand-ink dark:text-brand-ink flex flex-col gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail
                  className="text-brand-plum dark:text-brand-plum h-4 w-4"
                  aria-hidden="true"
                />
                support@za-store.example
              </div>
              <div className="flex items-center gap-2">
                <Phone
                  className="text-brand-plum dark:text-brand-plum h-4 w-4"
                  aria-hidden="true"
                />
                +964 770 000 0000
              </div>
              <div className="flex items-center gap-2">
                <MapPin
                  className="text-brand-plum dark:text-brand-plum h-4 w-4"
                  aria-hidden="true"
                />
                Baghdad, Iraq
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
