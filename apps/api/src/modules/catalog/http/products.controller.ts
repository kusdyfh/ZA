import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateProductUseCase } from '../application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from '../application/use-cases/update-product.use-case';
import { ChangeProductStatusUseCase } from '../application/use-cases/change-product-status.use-case';
import { UpdateProductContentUseCase } from '../application/use-cases/update-product-content.use-case';
import { SetProductTagsUseCase } from '../application/use-cases/set-product-tags.use-case';
import { GetProductUseCase } from '../application/use-cases/get-product.use-case';
import { ListProductsUseCase } from '../application/use-cases/list-products.use-case';
import { GetProductDetailUseCase } from '../application/use-cases/get-product-detail.use-case';
import { CreateProductDto } from '../application/dto/create-product.dto';
import { UpdateProductDto } from '../application/dto/update-product.dto';
import { ChangeProductStatusDto } from '../application/dto/change-product-status.dto';
import { UpdateProductContentDto } from '../application/dto/update-product-content.dto';
import { SetProductTagsDto } from '../application/dto/set-product-tags.dto';
import { ListProductsQueryDto } from '../application/dto/list-products-query.dto';
import { ProductResponseDto } from '../application/dto/product-response.dto';
import { ProductVariantResponseDto } from '../application/dto/product-variant-response.dto';
import { ProductMediaResponseDto } from '../application/dto/product-media-response.dto';
import { ProductSpecificationResponseDto } from '../application/dto/product-specification-response.dto';
import { paginate, type PaginatedResult } from '../../../shared/pagination/paginate';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';

class ProductDetailResponseDto {
  product!: ProductResponseDto;
  variants!: ProductVariantResponseDto[];
  media!: ProductMediaResponseDto[];
  specifications!: ProductSpecificationResponseDto[];
}

/**
 * Product CRUD + merchandising fields — docs/product/03-PRODUCTS.md.
 * Guarded (admin-only). Storefront-facing curated lists (Featured/Best
 * Sellers/New Arrivals) live on `StorefrontCatalogController` instead —
 * see docs/v2/adr/0016-api-layer-conventions.md.
 */
@ApiTags('Catalog — Products')
@ApiBearerAuth('access-token')
@Controller('catalog/products')
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly changeProductStatus: ChangeProductStatusUseCase,
    private readonly updateProductContent: UpdateProductContentUseCase,
    private readonly setProductTags: SetProductTagsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly getProductDetail: GetProductDetailUseCase,
  ) {}

  @Post()
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiCreatedResponse({ type: ProductResponseDto })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.createProduct.execute(dto);
    return ProductResponseDto.fromDomain(product);
  }

  @Get()
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_VIEW)
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  async list(@Query() query: ListProductsQueryDto): Promise<PaginatedResult<ProductResponseDto>> {
    const products = await this.listProducts.execute({
      status: query.status,
      categoryId: query.categoryId,
      brandId: query.brandId,
      isFeatured: query.isFeatured,
      isBestSeller: query.isBestSeller,
      isNewArrival: query.isNewArrival,
    });
    const dtos = products.map((product) => ProductResponseDto.fromDomain(product));
    return paginate(dtos, query, {
      searchableFields: ['name', 'sku'],
      sortableFields: ['name', 'sku', 'status', 'price'],
    });
  }

  @Get(':id')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_VIEW)
  @ApiOkResponse({ type: ProductResponseDto })
  async get(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.getProduct.execute({ productId: id });
    return ProductResponseDto.fromDomain(product);
  }

  @Get(':id/detail')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_VIEW)
  @ApiOkResponse({ type: ProductDetailResponseDto })
  async getDetail(@Param('id') id: string): Promise<ProductDetailResponseDto> {
    const detail = await this.getProductDetail.execute({ productId: id });
    return {
      product: ProductResponseDto.fromDomain(detail.product),
      variants: detail.variants.map((variant) => ProductVariantResponseDto.fromDomain(variant)),
      media: detail.media.map((item) => ProductMediaResponseDto.fromItem(item)),
      specifications: detail.specifications.map((item) => ProductSpecificationResponseDto.fromItem(item)),
    };
  }

  @Patch(':id')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ type: ProductResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto): Promise<ProductResponseDto> {
    const product = await this.updateProduct.execute({ productId: id, ...dto });
    return ProductResponseDto.fromDomain(product);
  }

  @Patch(':id/status')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ type: ProductResponseDto })
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeProductStatusDto,
  ): Promise<ProductResponseDto> {
    const product = await this.changeProductStatus.execute({ productId: id, status: dto.status });
    return ProductResponseDto.fromDomain(product);
  }

  @Patch(':id/content')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ type: ProductResponseDto })
  async updateContent(
    @Param('id') id: string,
    @Body() dto: UpdateProductContentDto,
  ): Promise<ProductResponseDto> {
    const product = await this.updateProductContent.execute({ productId: id, ...dto });
    return ProductResponseDto.fromDomain(product);
  }

  @Put(':id/tags')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ description: 'Tags replaced.' })
  async setTags(@Param('id') id: string, @Body() dto: SetProductTagsDto): Promise<{ replaced: true }> {
    await this.setProductTags.execute({ productId: id, tagIds: dto.tagIds });
    return { replaced: true };
  }
}
