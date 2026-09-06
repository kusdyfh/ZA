import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';
import { UpsertCmsPageUseCase } from '../application/use-cases/upsert-cms-page.use-case';
import { SetCmsPagePublishedUseCase } from '../application/use-cases/set-cms-page-published.use-case';
import { ListCmsPagesUseCase } from '../application/use-cases/list-cms-pages.use-case';
import { GetCmsPageUseCase } from '../application/use-cases/get-cms-page.use-case';
import { UpsertCmsPageDto } from '../application/dto/upsert-cms-page.dto';
import { CmsPageResponseDto } from '../application/dto/cms-page-response.dto';

/** Admin CMS management (ADR 0025) — reuses `CONTENT_MANAGE`, seeded in Epic 2, unused until now. */
@ApiTags('CMS')
@ApiBearerAuth('access-token')
@RequirePermission(PERMISSION_KEYS.CONTENT_MANAGE)
@Controller('cms/pages')
export class CmsController {
  constructor(
    private readonly upsertPage: UpsertCmsPageUseCase,
    private readonly setPublished: SetCmsPagePublishedUseCase,
    private readonly listPages: ListCmsPagesUseCase,
    private readonly getPage: GetCmsPageUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ type: CmsPageResponseDto, isArray: true })
  async list(): Promise<CmsPageResponseDto[]> {
    const pages = await this.listPages.execute();
    return pages.map(CmsPageResponseDto.fromDomain);
  }

  @Get(':slug')
  @ApiOkResponse({ type: CmsPageResponseDto })
  async get(@Param('slug') slug: string): Promise<CmsPageResponseDto> {
    const page = await this.getPage.execute(slug);
    return CmsPageResponseDto.fromDomain(page);
  }

  @Put()
  @ApiOkResponse({ type: CmsPageResponseDto })
  async upsert(@Body() dto: UpsertCmsPageDto): Promise<CmsPageResponseDto> {
    const page = await this.upsertPage.execute(dto);
    return CmsPageResponseDto.fromDomain(page);
  }

  @Post(':slug/publish')
  @ApiOkResponse({ type: CmsPageResponseDto })
  async publish(@Param('slug') slug: string): Promise<CmsPageResponseDto> {
    const page = await this.setPublished.execute(slug, true);
    return CmsPageResponseDto.fromDomain(page);
  }

  @Post(':slug/unpublish')
  @ApiOkResponse({ type: CmsPageResponseDto })
  async unpublish(@Param('slug') slug: string): Promise<CmsPageResponseDto> {
    const page = await this.setPublished.execute(slug, false);
    return CmsPageResponseDto.fromDomain(page);
  }
}
