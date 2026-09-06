import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CmsPage } from '../../domain/entities/cms-page.entity';
import type { CmsPageRepository, UpsertCmsPageData } from '../../domain/repositories/cms-page.repository';
import { CMS_PAGE_STATUS } from '../../domain/entities/cms-page.entity';
import { CmsPageMapper } from '../mappers/cms-page.mapper';

/** `CmsFaqItem[]` is a valid JSON array at runtime; Prisma's `InputJsonValue` type just doesn't structurally recognize a typed array without an index signature. */
function toInputJson(value: unknown): Prisma.InputJsonValue | undefined {
  return value === undefined ? undefined : (value as Prisma.InputJsonValue);
}

@Injectable()
export class PrismaCmsPageRepository implements CmsPageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(storeId: string, slug: string): Promise<CmsPage | null> {
    const record = await this.prisma.cmsPage.findUnique({ where: { storeId_slug: { storeId, slug } } });
    return record ? CmsPageMapper.toDomain(record) : null;
  }

  async findPublishedBySlug(storeId: string, slug: string): Promise<CmsPage | null> {
    const record = await this.prisma.cmsPage.findUnique({ where: { storeId_slug: { storeId, slug } } });
    return record && record.status === CMS_PAGE_STATUS.PUBLISHED ? CmsPageMapper.toDomain(record) : null;
  }

  async list(storeId: string): Promise<CmsPage[]> {
    const records = await this.prisma.cmsPage.findMany({ where: { storeId }, orderBy: { slug: 'asc' } });
    return records.map(CmsPageMapper.toDomain);
  }

  async upsert(data: UpsertCmsPageData): Promise<CmsPage> {
    const record = await this.prisma.cmsPage.upsert({
      where: { storeId_slug: { storeId: data.storeId, slug: data.slug } },
      update: {
        title: data.title,
        content: data.content,
        faqItems: toInputJson(data.faqItems),
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        ogImageUrl: data.ogImageUrl,
      },
      create: {
        storeId: data.storeId,
        slug: data.slug,
        title: data.title,
        content: data.content,
        faqItems: toInputJson(data.faqItems),
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        ogImageUrl: data.ogImageUrl,
      },
    });
    return CmsPageMapper.toDomain(record);
  }

  async save(page: CmsPage): Promise<void> {
    const props = page.toProps();
    await this.prisma.cmsPage.update({
      where: { id: props.id },
      data: { status: props.status, publishedAt: props.publishedAt },
    });
  }
}
