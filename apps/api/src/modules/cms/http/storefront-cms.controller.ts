import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../shared/decorators/public.decorator';
import { GetPublicCmsPageUseCase } from '../application/use-cases/get-public-cms-page.use-case';
import { CmsPageResponseDto } from '../application/dto/cms-page-response.dto';

/** Public storefront read (ADR 0025) — mirrors the `catalog/storefront` naming convention from ADR 0021. `PUBLISHED`-only, enforced server-side. */
@ApiTags('Storefront — CMS')
@Public()
@Controller('storefront/cms/pages')
export class StorefrontCmsController {
  constructor(private readonly getPublicPage: GetPublicCmsPageUseCase) {}

  @Get(':slug')
  @ApiOkResponse({ type: CmsPageResponseDto })
  async get(@Param('slug') slug: string): Promise<CmsPageResponseDto> {
    const page = await this.getPublicPage.execute(slug);
    return CmsPageResponseDto.fromDomain(page);
  }
}
