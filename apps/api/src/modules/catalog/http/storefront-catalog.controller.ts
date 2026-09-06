import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ListFeaturedProductsUseCase } from '../application/use-cases/list-featured-products.use-case';
import { ListBestSellersUseCase } from '../application/use-cases/list-best-sellers.use-case';
import { ListNewArrivalsUseCase } from '../application/use-cases/list-new-arrivals.use-case';
import { ListProductsUseCase } from '../application/use-cases/list-products.use-case';
import { GetPublicProductBySlugUseCase } from '../application/use-cases/get-public-product-by-slug.use-case';
import { GetPublicProductDetailUseCase } from '../application/use-cases/get-public-product-detail.use-case';
import { ListPublicProductVariantsUseCase } from '../application/use-cases/list-public-product-variants.use-case';
import { ListPublicCollectionsUseCase } from '../application/use-cases/list-public-collections.use-case';
import { ListPublicCollectionProductsUseCase } from '../application/use-cases/list-public-collection-products.use-case';
import { PublicListProductsQueryDto } from '../application/dto/public-list-products-query.dto';
import { PublicProductDetailResponseDto } from '../application/dto/public-product-detail-response.dto';
import { ProductResponseDto } from '../application/dto/product-response.dto';
import { ProductVariantResponseDto } from '../application/dto/product-variant-response.dto';
import { ProductMediaResponseDto } from '../application/dto/product-media-response.dto';
import { ProductSpecificationResponseDto } from '../application/dto/product-specification-response.dto';
import { CollectionResponseDto } from '../application/dto/collection-response.dto';
import { PRODUCT_STATUS } from '../domain/constants/product-status.constants';
import { paginate, type PaginatedResult } from '../../../shared/pagination/paginate';
import { Public } from '../../../shared/decorators/public.decorator';

/**
 * Curated, ACTIVE-only storefront product lists — docs/11-STOREFRONT-SPEC.md.
 * Fully public: no admin identity is ever required to browse the store.
 *
 * Extended in Epic 9.5 (ADR 0021) with the general public catalog-browse
 * surface (list/search/filter, product-by-slug, variants, collections)
 * that never existed before — every route below still requires nothing
 * more than `@Public()`, and every one is a thin composition over
 * already-existing Catalog use-cases (ADR 0021 §2).
 */
@ApiTags('Catalog — Storefront')
@Public()
@Controller('catalog/storefront')
export class StorefrontCatalogController {
  constructor(
    private readonly listFeaturedProducts: ListFeaturedProductsUseCase,
    private readonly listBestSellers: ListBestSellersUseCase,
    private readonly listNewArrivals: ListNewArrivalsUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly getPublicProductBySlug: GetPublicProductBySlugUseCase,
    private readonly getPublicProductDetail: GetPublicProductDetailUseCase,
    private readonly listPublicProductVariants: ListPublicProductVariantsUseCase,
    private readonly listPublicCollections: ListPublicCollectionsUseCase,
    private readonly listPublicCollectionProducts: ListPublicCollectionProductsUseCase,
  ) {}

  @Get('featured-products')
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  async featuredProducts(): Promise<ProductResponseDto[]> {
    const products = await this.listFeaturedProducts.execute();
    return products.map((product) => ProductResponseDto.fromDomain(product));
  }

  @Get('best-sellers')
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  async bestSellers(): Promise<ProductResponseDto[]> {
    const products = await this.listBestSellers.execute();
    return products.map((product) => ProductResponseDto.fromDomain(product));
  }

  @Get('new-arrivals')
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  async newArrivals(): Promise<ProductResponseDto[]> {
    const products = await this.listNewArrivals.execute();
    return products.map((product) => ProductResponseDto.fromDomain(product));
  }

  /**
   * General public product list/search/filter (ADR 0021 §2) — the
   * epic's "Public product listing", "Public products by category"
   * (via `categoryId`), "Public search" (via `search`), "Public
   * filtering", "Pagination", and "Sorting" scope items, all in one
   * endpoint. `status` is never accepted from the caller — always
   * forced to ACTIVE server-side.
   */
  @Get('products')
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  async products(@Query() query: PublicListProductsQueryDto): Promise<PaginatedResult<ProductResponseDto>> {
    const products = await this.listProducts.execute({
      status: PRODUCT_STATUS.ACTIVE,
      categoryId: query.categoryId,
      brandId: query.brandId,
      colorId: query.colorId,
      sizeId: query.sizeId,
      isFeatured: query.isFeatured,
      isBestSeller: query.isBestSeller,
      isNewArrival: query.isNewArrival,
      priceMin: query.priceMin,
      priceMax: query.priceMax,
    });
    const dtos = products.map((product) => ProductResponseDto.fromDomain(product));
    return paginate(dtos, query, {
      searchableFields: ['name', 'sku'],
      sortableFields: ['name', 'price'],
    });
  }

  @Get('products/:slug')
  @ApiOkResponse({ type: ProductResponseDto })
  async productBySlug(@Param('slug') slug: string): Promise<ProductResponseDto> {
    const product = await this.getPublicProductBySlug.execute({ slug });
    return ProductResponseDto.fromDomain(product);
  }

  @Get('products/:slug/detail')
  @ApiOkResponse({ type: PublicProductDetailResponseDto })
  async productDetailBySlug(@Param('slug') slug: string): Promise<PublicProductDetailResponseDto> {
    const detail = await this.getPublicProductDetail.execute({ slug });
    return {
      product: ProductResponseDto.fromDomain(detail.product),
      variants: detail.variants.map((variant) => ProductVariantResponseDto.fromDomain(variant)),
      media: detail.media.map((item) => ProductMediaResponseDto.fromItem(item)),
      specifications: detail.specifications.map((item) => ProductSpecificationResponseDto.fromItem(item)),
      related: detail.related.map((product) => ProductResponseDto.fromDomain(product)),
      crossSell: detail.crossSell.map((product) => ProductResponseDto.fromDomain(product)),
      upSell: detail.upSell.map((product) => ProductResponseDto.fromDomain(product)),
    };
  }

  @Get('products/:productId/variants')
  @ApiOkResponse({ type: ProductVariantResponseDto, isArray: true })
  async productVariants(@Param('productId') productId: string): Promise<ProductVariantResponseDto[]> {
    const variants = await this.listPublicProductVariants.execute({ productId });
    return variants.map((variant) => ProductVariantResponseDto.fromDomain(variant));
  }

  @Get('collections')
  @ApiOkResponse({ type: CollectionResponseDto, isArray: true })
  async collections(): Promise<CollectionResponseDto[]> {
    const collections = await this.listPublicCollections.execute();
    return collections.map((collection) => CollectionResponseDto.fromDomain(collection));
  }

  @Get('collections/:id/products')
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  async collectionProducts(@Param('id') id: string): Promise<ProductResponseDto[]> {
    const products = await this.listPublicCollectionProducts.execute({ collectionId: id });
    return products.map((product) => ProductResponseDto.fromDomain(product));
  }
}
