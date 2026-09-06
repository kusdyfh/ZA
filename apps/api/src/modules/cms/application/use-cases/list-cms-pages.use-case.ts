import { Inject, Injectable } from '@nestjs/common';
import { CMS_PAGE_REPOSITORY, type CmsPageRepository } from '../../domain/repositories/cms-page.repository';
import type { CmsPage } from '../../domain/entities/cms-page.entity';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';

@Injectable()
export class ListCmsPagesUseCase {
  constructor(
    @Inject(CMS_PAGE_REPOSITORY) private readonly pages: CmsPageRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(): Promise<CmsPage[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.pages.list(storeId);
  }
}
