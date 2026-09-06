import type { JsonLdData } from '@/lib/seo';

/** Renders a `schema.org` JSON-LD block (ADR 0022 §7) — Product/BreadcrumbList/FAQPage, wherever the data is actually available. */
export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
