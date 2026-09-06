import type { CmsPage as PrismaCmsPage } from '@prisma/client';
import { CmsPage, type CmsFaqItem } from '../../domain/entities/cms-page.entity';

export class CmsPageMapper {
  static toDomain(this: void, record: PrismaCmsPage): CmsPage {
    return CmsPage.reconstitute({
      id: record.id,
      storeId: record.storeId,
      slug: record.slug,
      title: record.title,
      content: record.content,
      faqItems: (record.faqItems as CmsFaqItem[] | null) ?? null,
      status: record.status,
      metaTitle: record.metaTitle,
      metaDescription: record.metaDescription,
      ogImageUrl: record.ogImageUrl,
      publishedAt: record.publishedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
