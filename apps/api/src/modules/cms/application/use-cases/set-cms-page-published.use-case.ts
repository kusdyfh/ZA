import { Inject, Injectable } from '@nestjs/common';
import { CMS_PAGE_REPOSITORY, type CmsPageRepository } from '../../domain/repositories/cms-page.repository';
import type { CmsPage } from '../../domain/entities/cms-page.entity';
import { CmsPageNotFoundError } from '../../domain/errors/cms.errors';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';

@Injectable()
export class SetCmsPagePublishedUseCase {
  constructor(
    @Inject(CMS_PAGE_REPOSITORY) private readonly pages: CmsPageRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(slug: string, published: boolean): Promise<CmsPage> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const page = await this.pages.findBySlug(storeId, slug);
    if (!page) {
      throw new CmsPageNotFoundError(slug);
    }
    if (published) {
      page.publish();
    } else {
      page.unpublish();
    }
    await this.pages.save(page);
    return page;
  }
}
