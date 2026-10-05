import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SetProductMediaUseCase } from '../application/use-cases/set-product-media.use-case';
import { ListProductMediaUseCase } from '../application/use-cases/list-product-media.use-case';
import { SetProductMediaDto } from '../application/dto/set-product-media.dto';
import { ProductMediaResponseDto } from '../application/dto/product-media-response.dto';
import { Public } from '../../../shared/decorators/public.decorator';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';

/** Product images/video (ordering, cover flag, alt text) — docs/product/03-PRODUCTS.md. */
@ApiTags('Catalog — Product Media')
@ApiBearerAuth('access-token')
@Controller('catalog/products/:productId/media')
export class ProductMediaController {
  constructor(
    private readonly setProductMedia: SetProductMediaUseCase,
    private readonly listProductMedia: ListProductMediaUseCase,
  ) {}

  @Put()
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ description: 'Media set replaced.' })
  async set(
    @Param('productId') productId: string,
    @Body() dto: SetProductMediaDto,
  ): Promise<{ replaced: true }> {
    await this.setProductMedia.execute({
      productId,
      media: dto.media.map((entry) => ({
        ...entry,
        altText: entry.altText ?? null,
        colorId: entry.colorId ?? null,
      })),
    });
    return { replaced: true };
  }

  @Get()
  @Public()
  @ApiOkResponse({ type: ProductMediaResponseDto, isArray: true })
  async list(
    @Param('productId') productId: string,
  ): Promise<ProductMediaResponseDto[]> {
    const media = await this.listProductMedia.execute({ productId });
    return media.map((item) => ProductMediaResponseDto.fromItem(item));
  }
}
