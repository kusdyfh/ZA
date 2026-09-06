import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { SetProductRelationsUseCase } from '../application/use-cases/set-product-relations.use-case';
import { ListProductRelationsUseCase } from '../application/use-cases/list-product-relations.use-case';
import { SetProductRelationsDto } from '../application/dto/set-product-relations.dto';
import { ProductResponseDto } from '../application/dto/product-response.dto';
import {
  PRODUCT_RELATION_TYPE,
  type ProductRelationTypeValue,
} from '../domain/constants/product-relation-type.constants';
import { Public } from '../../../shared/decorators/public.decorator';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';

class ListProductRelationsQueryDto {
  @IsIn(Object.values(PRODUCT_RELATION_TYPE))
  type!: ProductRelationTypeValue;
}

/** Admin-curated Related/Cross-sell/Up-sell products — docs/product/03-PRODUCTS.md. */
@ApiTags('Catalog — Product Relations')
@ApiBearerAuth('access-token')
@Controller('catalog/products/:productId/relations')
export class ProductRelationsController {
  constructor(
    private readonly setProductRelations: SetProductRelationsUseCase,
    private readonly listProductRelations: ListProductRelationsUseCase,
  ) {}

  @Put()
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ description: 'Relations of the given type replaced.' })
  async set(
    @Param('productId') productId: string,
    @Body() dto: SetProductRelationsDto,
  ): Promise<{ replaced: true }> {
    await this.setProductRelations.execute({
      productId,
      type: dto.type,
      relatedProductIds: dto.relatedProductIds,
    });
    return { replaced: true };
  }

  @Get()
  @Public()
  @ApiQuery({ name: 'type', enum: PRODUCT_RELATION_TYPE })
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  async list(
    @Param('productId') productId: string,
    @Query() query: ListProductRelationsQueryDto,
  ): Promise<ProductResponseDto[]> {
    const related = await this.listProductRelations.execute({ productId, type: query.type });
    return related.map((product) => ProductResponseDto.fromDomain(product));
  }
}
