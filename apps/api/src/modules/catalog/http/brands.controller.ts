import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateBrandUseCase } from '../application/use-cases/create-brand.use-case';
import { UpdateBrandUseCase } from '../application/use-cases/update-brand.use-case';
import { DeleteBrandUseCase } from '../application/use-cases/delete-brand.use-case';
import { ListBrandsUseCase } from '../application/use-cases/list-brands.use-case';
import { CreateBrandDto } from '../application/dto/create-brand.dto';
import { UpdateBrandDto } from '../application/dto/update-brand.dto';
import { BrandResponseDto } from '../application/dto/brand-response.dto';
import { ListQueryDto } from '../../../shared/pagination/list-query.dto';
import { paginate, type PaginatedResult } from '../../../shared/pagination/paginate';
import { Public } from '../../../shared/decorators/public.decorator';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';

/** Product brands — docs/product/03-PRODUCTS.md. Reads public (storefront filter), writes guarded. */
@ApiTags('Catalog — Brands')
@ApiBearerAuth('access-token')
@Controller('catalog/brands')
export class BrandsController {
  constructor(
    private readonly createBrand: CreateBrandUseCase,
    private readonly updateBrand: UpdateBrandUseCase,
    private readonly deleteBrand: DeleteBrandUseCase,
    private readonly listBrands: ListBrandsUseCase,
  ) {}

  @Post()
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiCreatedResponse({ type: BrandResponseDto })
  async create(@Body() dto: CreateBrandDto): Promise<BrandResponseDto> {
    const brand = await this.createBrand.execute(dto);
    return BrandResponseDto.fromDomain(brand);
  }

  @Get()
  @Public()
  @ApiOkResponse({ type: BrandResponseDto, isArray: true })
  async list(@Query() query: ListQueryDto): Promise<PaginatedResult<BrandResponseDto>> {
    const brands = await this.listBrands.execute();
    const dtos = brands.map((brand) => BrandResponseDto.fromDomain(brand));
    return paginate(dtos, query, { searchableFields: ['name'], sortableFields: ['name'] });
  }

  @Patch(':id')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ type: BrandResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateBrandDto): Promise<BrandResponseDto> {
    const brand = await this.updateBrand.execute({ brandId: id, ...dto });
    return BrandResponseDto.fromDomain(brand);
  }

  @Delete(':id')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteBrand.execute({ brandId: id });
  }
}
