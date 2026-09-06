/** The fixed, known set of pages this epic scopes (ADR 0025) — `@@unique([storeId, slug])` still allows more later without a schema change. */
export const CMS_PAGE_SLUGS = ['about', 'contact', 'faq', 'privacy-policy', 'terms-of-service'] as const;
export type CmsPageSlug = (typeof CMS_PAGE_SLUGS)[number];
