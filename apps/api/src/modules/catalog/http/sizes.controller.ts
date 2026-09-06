import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateSizeUseCase } from '../application/use-cases/create-size.use-case';
import { UpdateSizeUseCase } from '../application/use-cases/update-size.use-case';
import { DeleteSizeUseCase } from '../application/use-cases/delete-size.use-case';
import { ListSizesUseCase } from '../application/use-cases/list-sizes.use-case';
import { CreateSizeDto } from '../application/dto/create-size.dto';
import { UpdateSizeDto } from '../application/dto/update-size.dto';
import { SizeResponseDto } from '../application/dto/size-response.dto';
import { ListQueryDto } from '../../../shared/pagination/list-query.dto';
import { paginate, type PaginatedResult } from '../../../shared/pagination/paginate';
import { Public } from '../../../shared/decorators/public.decorator';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';

/** Variant sizes — docs/product/03-PRODUCTS.md. Reads public (storefront size filter), writes guarded. */
@ApiTags('Catalog — Sizes')
@ApiBearerAuth('access-token')
@Controller('catalog/sizes')
export class SizesController {
  constructor(
    private readonly createSize: CreateSizeUseCase,
    private readonly updateSize: UpdateSizeUseCase,
    private readonly deleteSize: DeleteSizeUseCase,
    private readonly listSizes: ListSizesUseCase,
  ) {}

  @Post()
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiCreatedResponse({ type: SizeResponseDto })
  async create(@Body() dto: CreateSizeDto): Promise<SizeResponseDto> {
    const size = await this.createSize.execute(dto);
    return SizeResponseDto.fromDomain(size);
  }

  @Get()
  @Public()
  @ApiOkResponse({ type: SizeResponseDto, isArray: true })
  async list(@Query() query: ListQueryDto): Promise<PaginatedResult<SizeResponseDto>> {
    const sizes = await this.listSizes.execute();
    const dtos = sizes.map((size) => SizeResponseDto.fromDomain(size));
    return paginate(dtos, query, { searchableFields: ['label'], sortableFields: ['label', 'sortOrder'] });
  }

  @Patch(':id')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ type: SizeResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateSizeDto): Promise<SizeResponseDto> {
    const size = await this.updateSize.execute({ sizeId: id, ...dto });
    return SizeResponseDto.fromDomain(size);
  }

  @Delete(':id')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteSize.execute({ sizeId: id });
  }
}
