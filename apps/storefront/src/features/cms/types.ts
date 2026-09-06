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
  status: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
}
