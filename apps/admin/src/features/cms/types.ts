export const CMS_PAGE_SLUGS = ['about', 'contact', 'faq', 'privacy-policy', 'terms-of-service'] as const;
export type CmsPageSlug = (typeof CMS_PAGE_SLUGS)[number];

export interface CmsFaqItem {
  question: string;
  answer: string;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  faqItems: CmsFaqItem[] | null;
  status: 'DRAFT' | 'PUBLISHED';
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface UpsertCmsPageInput {
  slug: string;
  title: string;
  content: string;
  faqItems?: CmsFaqItem[];
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
}
