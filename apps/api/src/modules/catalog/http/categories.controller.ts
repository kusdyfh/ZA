import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { CreateCategoryUseCase } from '../application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '../application/use-cases/update-category.use-case';
import { SetCategoryActiveUseCase } from '../application/use-cases/set-category-active.use-case';
import { DeleteCategoryUseCase } from '../application/use-cases/delete-category.use-case';
import { GetCategoryTreeUseCase } from '../application/use-cases/get-category-tree.use-case';
import { ListCategoriesUseCase } from '../application/use-cases/list-categories.use-case';
import { CreateCategoryDto } from '../application/dto/create-category.dto';
import { UpdateCategoryDto } from '../application/dto/update-category.dto';
import { CategoryResponseDto } from '../application/dto/category-response.dto';
import { ListQueryDto } from '../../../shared/pagination/list-query.dto';
import { paginate, type PaginatedResult } from '../../../shared/pagination/paginate';
import { Public } from '../../../shared/decorators/public.decorator';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';

class SetCategoryActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

interface CategoryTreeNodeResponse {
  category: CategoryResponseDto;
  children: CategoryTreeNodeResponse[];
}

/** The category browsing tree — docs/product/04-CATEGORIES.md. Reads are public (storefront browsing); writes are guarded. */
@ApiTags('Catalog — Categories')
@ApiBearerAuth('access-token')
@Controller('catalog/categories')
export class CategoriesController {
  constructor(
    private readonly createCategory: CreateCategoryUseCase,
    private readonly updateCategory: UpdateCategoryUseCase,
    private readonly setCategoryActive: SetCategoryActiveUseCase,
    private readonly deleteCategory: DeleteCategoryUseCase,
    private readonly getCategoryTree: GetCategoryTreeUseCase,
    private readonly listCategories: ListCategoriesUseCase,
  ) {}

  @Post()
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiCreatedResponse({ type: CategoryResponseDto })
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.createCategory.execute(dto);
    return CategoryResponseDto.fromDomain(category);
  }

  @Get()
  @Public()
  @ApiOkResponse({ type: CategoryResponseDto, isArray: true })
  async list(@Query() query: ListQueryDto): Promise<PaginatedResult<CategoryResponseDto>> {
    const categories = await this.listCategories.execute();
    const dtos = categories.map((category) => CategoryResponseDto.fromDomain(category));
    return paginate(dtos, query, {
      searchableFields: ['name'],
      sortableFields: ['name', 'sortOrder'],
    });
  }

  @Get('tree')
  @Public()
  @ApiOkResponse({ description: 'The full category hierarchy.' })
  async tree(): Promise<CategoryTreeNodeResponse[]> {
    const nodes = await this.getCategoryTree.execute();
    const toResponse = (node: (typeof nodes)[number]): CategoryTreeNodeResponse => ({
      category: CategoryResponseDto.fromDomain(node.category),
      children: node.children.map(toResponse),
    });
    return nodes.map(toResponse);
  }

  @Patch(':id')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ type: CategoryResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.updateCategory.execute({ categoryId: id, ...dto });
    return CategoryResponseDto.fromDomain(category);
  }

  @Patch(':id/active')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ type: CategoryResponseDto })
  async setActive(
    @Param('id') id: string,
    @Body() dto: SetCategoryActiveDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.setCategoryActive.execute({ categoryId: id, isActive: dto.isActive });
    return CategoryResponseDto.fromDomain(category);
  }

  @Delete(':id')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteCategory.execute({ categoryId: id });
  }
}
