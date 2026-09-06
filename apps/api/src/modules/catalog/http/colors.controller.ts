import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateColorUseCase } from '../application/use-cases/create-color.use-case';
import { UpdateColorUseCase } from '../application/use-cases/update-color.use-case';
import { DeleteColorUseCase } from '../application/use-cases/delete-color.use-case';
import { ListColorsUseCase } from '../application/use-cases/list-colors.use-case';
import { CreateColorDto } from '../application/dto/create-color.dto';
import { UpdateColorDto } from '../application/dto/update-color.dto';
import { ColorResponseDto } from '../application/dto/color-response.dto';
import { ListQueryDto } from '../../../shared/pagination/list-query.dto';
import { paginate, type PaginatedResult } from '../../../shared/pagination/paginate';
import { Public } from '../../../shared/decorators/public.decorator';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';

/** Variant colors — docs/product/03-PRODUCTS.md. Reads public (storefront swatch filter), writes guarded. */
@ApiTags('Catalog — Colors')
@ApiBearerAuth('access-token')
@Controller('catalog/colors')
export class ColorsController {
  constructor(
    private readonly createColor: CreateColorUseCase,
    private readonly updateColor: UpdateColorUseCase,
    private readonly deleteColor: DeleteColorUseCase,
    private readonly listColors: ListColorsUseCase,
  ) {}

  @Post()
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiCreatedResponse({ type: ColorResponseDto })
  async create(@Body() dto: CreateColorDto): Promise<ColorResponseDto> {
    const color = await this.createColor.execute(dto);
    return ColorResponseDto.fromDomain(color);
  }

  @Get()
  @Public()
  @ApiOkResponse({ type: ColorResponseDto, isArray: true })
  async list(@Query() query: ListQueryDto): Promise<PaginatedResult<ColorResponseDto>> {
    const colors = await this.listColors.execute();
    const dtos = colors.map((color) => ColorResponseDto.fromDomain(color));
    return paginate(dtos, query, { searchableFields: ['name'], sortableFields: ['name'] });
  }

  @Patch(':id')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ type: ColorResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateColorDto): Promise<ColorResponseDto> {
    const color = await this.updateColor.execute({ colorId: id, ...dto });
    return ColorResponseDto.fromDomain(color);
  }

  @Delete(':id')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteColor.execute({ colorId: id });
  }
}
