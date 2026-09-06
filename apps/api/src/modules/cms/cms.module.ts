import { Module } from '@nestjs/common';
import { CMS_PAGE_REPOSITORY } from './domain/repositories/cms-page.repository';
import { PrismaCmsPageRepository } from './infrastructure/repositories/prisma-cms-page.repository';
import { UpsertCmsPageUseCase } from './application/use-cases/upsert-cms-page.use-case';
import { SetCmsPagePublishedUseCase } from './application/use-cases/set-cms-page-published.use-case';
import { ListCmsPagesUseCase } from './application/use-cases/list-cms-pages.use-case';
import { GetCmsPageUseCase } from './application/use-cases/get-cms-page.use-case';
import { GetPublicCmsPageUseCase } from './application/use-cases/get-public-cms-page.use-case';
import { CmsController } from './http/cms.controller';
import { StorefrontCmsController } from './http/storefront-cms.controller';

/** CMS (ADR 0025) — About/Contact/FAQ/Privacy Policy/Terms of Service, managed from the admin dashboard, read publicly by the storefront. */
@Module({
  controllers: [CmsController, StorefrontCmsController],
  providers: [
    { provide: CMS_PAGE_REPOSITORY, useClass: PrismaCmsPageRepository },
    UpsertCmsPageUseCase,
    SetCmsPagePublishedUseCase,
    ListCmsPagesUseCase,
    GetCmsPageUseCase,
    GetPublicCmsPageUseCase,
  ],
})
export class CmsModule {}
