import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateProductVariantUseCase } from '../application/use-cases/create-product-variant.use-case';
import { UpdateProductVariantUseCase } from '../application/use-cases/update-product-variant.use-case';
import { DeleteProductVariantUseCase } from '../application/use-cases/delete-product-variant.use-case';
import { ListProductVariantsUseCase } from '../application/use-cases/list-product-variants.use-case';
import { CreateProductVariantDto } from '../application/dto/create-product-variant.dto';
import { UpdateProductVariantDto } from '../application/dto/update-product-variant.dto';
import { ProductVariantResponseDto } from '../application/dto/product-variant-response.dto';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';

/** Product Variants (color/size/SKU combinations) — docs/product/03-PRODUCTS.md. Guarded (admin-only). */
@ApiTags('Catalog — Product Variants')
@ApiBearerAuth('access-token')
@Controller('catalog/product-variants')
export class ProductVariantsController {
  constructor(
    private readonly createProductVariant: CreateProductVariantUseCase,
    private readonly updateProductVariant: UpdateProductVariantUseCase,
    private readonly deleteProductVariant: DeleteProductVariantUseCase,
    private readonly listProductVariants: ListProductVariantsUseCase,
  ) {}

  @Post()
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiCreatedResponse({ type: ProductVariantResponseDto })
  async create(@Body() dto: CreateProductVariantDto): Promise<ProductVariantResponseDto> {
    const variant = await this.createProductVariant.execute(dto);
    return ProductVariantResponseDto.fromDomain(variant);
  }

  @Get('by-product/:productId')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_VIEW)
  @ApiOkResponse({ type: ProductVariantResponseDto, isArray: true })
  async listByProduct(@Param('productId') productId: string): Promise<ProductVariantResponseDto[]> {
    const variants = await this.listProductVariants.execute({ productId });
    return variants.map((variant) => ProductVariantResponseDto.fromDomain(variant));
  }

  @Patch(':id')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ type: ProductVariantResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductVariantDto,
  ): Promise<ProductVariantResponseDto> {
    const variant = await this.updateProductVariant.execute({ variantId: id, ...dto });
    return ProductVariantResponseDto.fromDomain(variant);
  }

  @Delete(':id')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteProductVariant.execute({ variantId: id });
  }
}
