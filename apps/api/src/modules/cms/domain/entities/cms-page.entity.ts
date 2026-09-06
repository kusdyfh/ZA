export const CMS_PAGE_STATUS = { DRAFT: 'DRAFT', PUBLISHED: 'PUBLISHED' } as const;
export type CmsPageStatusValue = (typeof CMS_PAGE_STATUS)[keyof typeof CMS_PAGE_STATUS];

export interface CmsFaqItem {
  question: string;
  answer: string;
}

export interface CmsPageProps {
  id: string;
  storeId: string;
  slug: string;
  title: string;
  content: string;
  faqItems: CmsFaqItem[] | null;
  status: CmsPageStatusValue;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** One model for five fixed page slugs (ADR 0025) — see the Prisma schema's doc comment. */
export class CmsPage {
  private constructor(private props: CmsPageProps) {}

  static reconstitute(props: CmsPageProps): CmsPage {
    return new CmsPage(props);
  }

  updateContent(input: {
    title: string;
    content: string;
    faqItems?: CmsFaqItem[] | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    ogImageUrl?: string | null;
  }): void {
    this.props.title = input.title;
    this.props.content = input.content;
    if (input.faqItems !== undefined) this.props.faqItems = input.faqItems;
    if (input.metaTitle !== undefined) this.props.metaTitle = input.metaTitle;
    if (input.metaDescription !== undefined) this.props.metaDescription = input.metaDescription;
    if (input.ogImageUrl !== undefined) this.props.ogImageUrl = input.ogImageUrl;
  }

  publish(): void {
    this.props.status = CMS_PAGE_STATUS.PUBLISHED;
    this.props.publishedAt = new Date();
  }

  unpublish(): void {
    this.props.status = CMS_PAGE_STATUS.DRAFT;
  }

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get slug(): string {
    return this.props.slug;
  }

  get title(): string {
    return this.props.title;
  }

  get content(): string {
    return this.props.content;
  }

  get faqItems(): CmsFaqItem[] | null {
    return this.props.faqItems;
  }

  get status(): CmsPageStatusValue {
    return this.props.status;
  }

  get isPublished(): boolean {
    return this.props.status === CMS_PAGE_STATUS.PUBLISHED;
  }

  get metaTitle(): string | null {
    return this.props.metaTitle;
  }

  get metaDescription(): string | null {
    return this.props.metaDescription;
  }

  get ogImageUrl(): string | null {
    return this.props.ogImageUrl;
  }

  get publishedAt(): Date | null {
    return this.props.publishedAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toProps(): CmsPageProps {
    return { ...this.props };
  }
}
