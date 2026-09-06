import { Inject, Injectable } from '@nestjs/common';
import { CMS_PAGE_REPOSITORY, type CmsPageRepository } from '../../domain/repositories/cms-page.repository';
import type { CmsPage } from '../../domain/entities/cms-page.entity';
import { CmsPageNotFoundError } from '../../domain/errors/cms.errors';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';

/** Admin read (any status) — the public equivalent is `GetPublicCmsPageUseCase`, `PUBLISHED`-only. */
@Injectable()
export class GetCmsPageUseCase {
  constructor(
    @Inject(CMS_PAGE_REPOSITORY) private readonly pages: CmsPageRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(slug: string): Promise<CmsPage> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const page = await this.pages.findBySlug(storeId, slug);
    if (!page) {
      throw new CmsPageNotFoundError(slug);
    }
    return page;
  }
}
