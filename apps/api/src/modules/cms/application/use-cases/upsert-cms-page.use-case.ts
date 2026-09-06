import { Inject, Injectable } from '@nestjs/common';
import { CMS_PAGE_REPOSITORY, type CmsPageRepository } from '../../domain/repositories/cms-page.repository';
import type { CmsFaqItem, CmsPage } from '../../domain/entities/cms-page.entity';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';

export interface UpsertCmsPageInput {
  slug: string;
  title: string;
  content: string;
  faqItems?: CmsFaqItem[] | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
}

@Injectable()
export class UpsertCmsPageUseCase {
  constructor(
    @Inject(CMS_PAGE_REPOSITORY) private readonly pages: CmsPageRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: UpsertCmsPageInput): Promise<CmsPage> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.pages.upsert({ storeId, ...input });
  }
}
