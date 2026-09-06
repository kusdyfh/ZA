import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateTagUseCase } from '../application/use-cases/create-tag.use-case';
import { UpdateTagUseCase } from '../application/use-cases/update-tag.use-case';
import { DeleteTagUseCase } from '../application/use-cases/delete-tag.use-case';
import { ListTagsUseCase } from '../application/use-cases/list-tags.use-case';
import { CreateTagDto } from '../application/dto/create-tag.dto';
import { UpdateTagDto } from '../application/dto/update-tag.dto';
import { TagResponseDto } from '../application/dto/tag-response.dto';
import { ListQueryDto } from '../../../shared/pagination/list-query.dto';
import { paginate, type PaginatedResult } from '../../../shared/pagination/paginate';
import { Public } from '../../../shared/decorators/public.decorator';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';

/** Product tags — docs/product/03-PRODUCTS.md. Reads public, writes guarded. */
@ApiTags('Catalog — Tags')
@ApiBearerAuth('access-token')
@Controller('catalog/tags')
export class TagsController {
  constructor(
    private readonly createTag: CreateTagUseCase,
    private readonly updateTag: UpdateTagUseCase,
    private readonly deleteTag: DeleteTagUseCase,
    private readonly listTags: ListTagsUseCase,
  ) {}

  @Post()
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiCreatedResponse({ type: TagResponseDto })
  async create(@Body() dto: CreateTagDto): Promise<TagResponseDto> {
    const tag = await this.createTag.execute(dto);
    return TagResponseDto.fromDomain(tag);
  }

  @Get()
  @Public()
  @ApiOkResponse({ type: TagResponseDto, isArray: true })
  async list(@Query() query: ListQueryDto): Promise<PaginatedResult<TagResponseDto>> {
    const tags = await this.listTags.execute();
    const dtos = tags.map((tag) => TagResponseDto.fromDomain(tag));
    return paginate(dtos, query, { searchableFields: ['name'], sortableFields: ['name'] });
  }

  @Patch(':id')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ type: TagResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateTagDto): Promise<TagResponseDto> {
    const tag = await this.updateTag.execute({ tagId: id, ...dto });
    return TagResponseDto.fromDomain(tag);
  }

  @Delete(':id')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteTag.execute({ tagId: id });
  }
}
