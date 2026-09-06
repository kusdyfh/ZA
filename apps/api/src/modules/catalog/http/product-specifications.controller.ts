import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SetProductSpecificationsUseCase } from '../application/use-cases/set-product-specifications.use-case';
import { ListProductSpecificationsUseCase } from '../application/use-cases/list-product-specifications.use-case';
import { SetProductSpecificationsDto } from '../application/dto/set-product-specifications.dto';
import { ProductSpecificationResponseDto } from '../application/dto/product-specification-response.dto';
import { Public } from '../../../shared/decorators/public.decorator';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';

/** Structured product spec sheet — docs/product/03-PRODUCTS.md. */
@ApiTags('Catalog — Product Specifications')
@ApiBearerAuth('access-token')
@Controller('catalog/products/:productId/specifications')
export class ProductSpecificationsController {
  constructor(
    private readonly setProductSpecifications: SetProductSpecificationsUseCase,
    private readonly listProductSpecifications: ListProductSpecificationsUseCase,
  ) {}

  @Put()
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ description: 'Specification sheet replaced.' })
  async set(
    @Param('productId') productId: string,
    @Body() dto: SetProductSpecificationsDto,
  ): Promise<{ replaced: true }> {
    await this.setProductSpecifications.execute({ productId, specifications: dto.specifications });
    return { replaced: true };
  }

  @Get()
  @Public()
  @ApiOkResponse({ type: ProductSpecificationResponseDto, isArray: true })
  async list(@Param('productId') productId: string): Promise<ProductSpecificationResponseDto[]> {
    const specifications = await this.listProductSpecifications.execute({ productId });
    return specifications.map((item) => ProductSpecificationResponseDto.fromItem(item));
  }
}
