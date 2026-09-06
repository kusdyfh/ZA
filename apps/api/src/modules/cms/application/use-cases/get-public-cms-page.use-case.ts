import { Inject, Injectable } from '@nestjs/common';
import { CMS_PAGE_REPOSITORY, type CmsPageRepository } from '../../domain/repositories/cms-page.repository';
import type { CmsPage } from '../../domain/entities/cms-page.entity';
import { CmsPageNotFoundError } from '../../domain/errors/cms.errors';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';

/** Public storefront read (ADR 0025) — `PUBLISHED`-only. */
@Injectable()
export class GetPublicCmsPageUseCase {
  constructor(
    @Inject(CMS_PAGE_REPOSITORY) private readonly pages: CmsPageRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(slug: string): Promise<CmsPage> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const page = await this.pages.findPublishedBySlug(storeId, slug);
    if (!page) {
      throw new CmsPageNotFoundError(slug);
    }
    return page;
  }
}
