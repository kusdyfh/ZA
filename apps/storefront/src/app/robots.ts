import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/** Session-specific routes are never worth indexing (ADR 0025). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account', '/account/*', '/cart', '/checkout', '/checkout/*'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
