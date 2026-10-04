import type { Metadata } from 'next';
import { SITE_URL } from './config';

export { SITE_URL };

const SITE_NAME = 'ZA Store';
const DEFAULT_DESCRIPTION =
  'Premium medical scrubs, lab coats, and accessories — soft, modern, and made for long shifts.';

export interface BuildMetadataInput {
  title: string;
  description?: string;
  /** Path only, e.g. "/shop" — combined with NEXT_PUBLIC_SITE_URL for the canonical URL. */
  path: string;
  image?: string;
  noIndex?: boolean;
}

/**
 * The one shared metadata helper every page's `generateMetadata()`
 * calls, per docs/11-STOREFRONT-SPEC.md's cross-cutting convention
 * (ADR 0022 §7) — no page hand-rolls its own `<head>` tags.
 */
export function buildMetadata({
  title,
  description,
  path,
  image,
  noIndex,
}: BuildMetadataInput): Metadata {
  const canonicalUrl = `${SITE_URL}${path}`;
  const resolvedDescription = description ?? DEFAULT_DESCRIPTION;

  return {
    title,
    description: resolvedDescription,
    alternates: { canonical: canonicalUrl },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description: resolvedDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: 'website',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description: resolvedDescription,
      images: image ? [image] : undefined,
    },
  };
}

/** JSON-LD helper types — rendered via the <JsonLd> component, kept loose (schema.org has no first-party TS types). */
export type JsonLdData = Record<string, unknown>;
