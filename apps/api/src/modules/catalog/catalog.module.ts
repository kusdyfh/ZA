import { Module } from '@nestjs/common';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository';
import { BRAND_REPOSITORY } from './domain/repositories/brand.repository';
import { COLLECTION_REPOSITORY } from './domain/repositories/collection.repository';
import { TAG_REPOSITORY } from './domain/repositories/tag.repository';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository';
import { COLOR_REPOSITORY } from './domain/repositories/color.repository';
import { SIZE_REPOSITORY } from './domain/repositories/size.repository';
import { PRODUCT_VARIANT_REPOSITORY } from './domain/repositories/product-variant.repository';
import { PRODUCT_MEDIA_REPOSITORY } from './domain/repositories/product-media.repository';
import { PRODUCT_SPECIFICATION_REPOSITORY } from './domain/repositories/product-specification.repository';
import { PRODUCT_RELATION_REPOSITORY } from './domain/repositories/product-relation.repository';

import { PrismaCategoryRepository } from './infrastructure/repositories/prisma-category.repository';
import { PrismaBrandRepository } from './infrastructure/repositories/prisma-brand.repository';
import { PrismaCollectionRepository } from './infrastructure/repositories/prisma-collection.repository';
import { PrismaTagRepository } from './infrastructure/repositories/prisma-tag.repository';
import { PrismaProductRepository } from './infrastructure/repositories/prisma-product.repository';
import { PrismaColorRepository } from './infrastructure/repositories/prisma-color.repository';
import { PrismaSizeRepository } from './infrastructure/repositories/prisma-size.repository';
import { PrismaProductVariantRepository } from './infrastructure/repositories/prisma-product-variant.repository';
import { PrismaProductMediaRepository } from './infrastructure/repositories/prisma-product-media.repository';
import { PrismaProductSpecificationRepository } from './infrastructure/repositories/prisma-product-specification.repository';
import { PrismaProductRelationRepository } from './infrastructure/repositories/prisma-product-relation.repository';

import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case';
import { SetCategoryActiveUseCase } from './application/use-cases/set-category-active.use-case';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case';
import { GetCategoryTreeUseCase } from './application/use-cases/get-category-tree.use-case';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';

import { CreateBrandUseCase } from './application/use-cases/create-brand.use-case';
import { UpdateBrandUseCase } from './application/use-cases/update-brand.use-case';
import { DeleteBrandUseCase } from './application/use-cases/delete-brand.use-case';
import { ListBrandsUseCase } from './application/use-cases/list-brands.use-case';

import { CreateTagUseCase } from './application/use-cases/create-tag.use-case';
import { UpdateTagUseCase } from './application/use-cases/update-tag.use-case';
import { DeleteTagUseCase } from './application/use-cases/delete-tag.use-case';
import { ListTagsUseCase } from './application/use-cases/list-tags.use-case';

import { CreateCollectionUseCase } from './application/use-cases/create-collection.use-case';
import { UpdateCollectionUseCase } from './application/use-cases/update-collection.use-case';
import { SetCollectionActiveUseCase } from './application/use-cases/set-collection-active.use-case';
import { DeleteCollectionUseCase } from './application/use-cases/delete-collection.use-case';
import { SetCollectionProductsUseCase } from './application/use-cases/set-collection-products.use-case';
import { ListCollectionProductsUseCase } from './application/use-cases/list-collection-products.use-case';

import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { ChangeProductStatusUseCase } from './application/use-cases/change-product-status.use-case';
import { SetProductTagsUseCase } from './application/use-cases/set-product-tags.use-case';
import { GetProductUseCase } from './application/use-cases/get-product.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';

import { CreateColorUseCase } from './application/use-cases/create-color.use-case';
import { UpdateColorUseCase } from './application/use-cases/update-color.use-case';
import { DeleteColorUseCase } from './application/use-cases/delete-color.use-case';
import { ListColorsUseCase } from './application/use-cases/list-colors.use-case';

import { CreateSizeUseCase } from './application/use-cases/create-size.use-case';
import { UpdateSizeUseCase } from './application/use-cases/update-size.use-case';
import { DeleteSizeUseCase } from './application/use-cases/delete-size.use-case';
import { ListSizesUseCase } from './application/use-cases/list-sizes.use-case';

import { CreateProductVariantUseCase } from './application/use-cases/create-product-variant.use-case';
import { UpdateProductVariantUseCase } from './application/use-cases/update-product-variant.use-case';
import { DeleteProductVariantUseCase } from './application/use-cases/delete-product-variant.use-case';
import { ListProductVariantsUseCase } from './application/use-cases/list-product-variants.use-case';

import { SetProductMediaUseCase } from './application/use-cases/set-product-media.use-case';
import { ListProductMediaUseCase } from './application/use-cases/list-product-media.use-case';

import { SetProductSpecificationsUseCase } from './application/use-cases/set-product-specifications.use-case';
import { ListProductSpecificationsUseCase } from './application/use-cases/list-product-specifications.use-case';

import { UpdateProductContentUseCase } from './application/use-cases/update-product-content.use-case';

import { SetProductRelationsUseCase } from './application/use-cases/set-product-relations.use-case';
import { ListProductRelationsUseCase } from './application/use-cases/list-product-relations.use-case';

import { ListFeaturedProductsUseCase } from './application/use-cases/list-featured-products.use-case';
import { ListBestSellersUseCase } from './application/use-cases/list-best-sellers.use-case';
import { ListNewArrivalsUseCase } from './application/use-cases/list-new-arrivals.use-case';

import { GetProductDetailUseCase } from './application/use-cases/get-product-detail.use-case';

import { GetPublicProductBySlugUseCase } from './application/use-cases/get-public-product-by-slug.use-case';
import { GetPublicProductDetailUseCase } from './application/use-cases/get-public-product-detail.use-case';
import { ListPublicProductVariantsUseCase } from './application/use-cases/list-public-product-variants.use-case';
import { ListPublicCollectionsUseCase } from './application/use-cases/list-public-collections.use-case';
import { ListPublicCollectionProductsUseCase } from './application/use-cases/list-public-collection-products.use-case';

import { ProductsController } from './http/products.controller';
import { ProductVariantsController } from './http/product-variants.controller';
import { ProductMediaController } from './http/product-media.controller';
import { ProductSpecificationsController } from './http/product-specifications.controller';
import { ProductRelationsController } from './http/product-relations.controller';
import { CategoriesController } from './http/categories.controller';
import { CollectionsController } from './http/collections.controller';
import { BrandsController } from './http/brands.controller';
import { TagsController } from './http/tags.controller';
import { ColorsController } from './http/colors.controller';
import { SizesController } from './http/sizes.controller';
import { StorefrontCatalogController } from './http/storefront-catalog.controller';

/**
 * The Catalog bounded context (docs/06-DDD-BOUNDED-CONTEXTS.md) — Product/
 * Category/Collection/Brand/Tag domains (Epic 3A), plus Variants/Colors/
 * Sizes/Media/Specifications/Relations (Epic 3B: Product Experience &
 * Merchandising). Epic 6 (API Layer) adds controllers directly here,
 * guarded by the app-wide `TemporaryAdminGuard` except where marked
 * `@Public()` (storefront reads, per docs/v2/adr/0016).
 */
const REPOSITORY_PROVIDERS = [
  { provide: CATEGORY_REPOSITORY, useClass: PrismaCategoryRepository },
  { provide: BRAND_REPOSITORY, useClass: PrismaBrandRepository },
  { provide: COLLECTION_REPOSITORY, useClass: PrismaCollectionRepository },
  { provide: TAG_REPOSITORY, useClass: PrismaTagRepository },
  { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
  { provide: COLOR_REPOSITORY, useClass: PrismaColorRepository },
  { provide: SIZE_REPOSITORY, useClass: PrismaSizeRepository },
  { provide: PRODUCT_VARIANT_REPOSITORY, useClass: PrismaProductVariantRepository },
  { provide: PRODUCT_MEDIA_REPOSITORY, useClass: PrismaProductMediaRepository },
  { provide: PRODUCT_SPECIFICATION_REPOSITORY, useClass: PrismaProductSpecificationRepository },
  { provide: PRODUCT_RELATION_REPOSITORY, useClass: PrismaProductRelationRepository },
];

const USE_CASE_PROVIDERS = [
  CreateCategoryUseCase,
  UpdateCategoryUseCase,
  SetCategoryActiveUseCase,
  DeleteCategoryUseCase,
  GetCategoryTreeUseCase,
  ListCategoriesUseCase,

  CreateBrandUseCase,
  UpdateBrandUseCase,
  DeleteBrandUseCase,
  ListBrandsUseCase,

  CreateTagUseCase,
  UpdateTagUseCase,
  DeleteTagUseCase,
  ListTagsUseCase,

  CreateCollectionUseCase,
  UpdateCollectionUseCase,
  SetCollectionActiveUseCase,
  DeleteCollectionUseCase,
  SetCollectionProductsUseCase,
  ListCollectionProductsUseCase,

  CreateProductUseCase,
  UpdateProductUseCase,
  ChangeProductStatusUseCase,
  SetProductTagsUseCase,
  GetProductUseCase,
  ListProductsUseCase,

  CreateColorUseCase,
  UpdateColorUseCase,
  DeleteColorUseCase,
  ListColorsUseCase,

  CreateSizeUseCase,
  UpdateSizeUseCase,
  DeleteSizeUseCase,
  ListSizesUseCase,

  CreateProductVariantUseCase,
  UpdateProductVariantUseCase,
  DeleteProductVariantUseCase,
  ListProductVariantsUseCase,

  SetProductMediaUseCase,
  ListProductMediaUseCase,

  SetProductSpecificationsUseCase,
  ListProductSpecificationsUseCase,

  UpdateProductContentUseCase,

  SetProductRelationsUseCase,
  ListProductRelationsUseCase,

  ListFeaturedProductsUseCase,
  ListBestSellersUseCase,
  ListNewArrivalsUseCase,

  GetProductDetailUseCase,

  // Epic 9.5 (Public Catalog API) — ADR 0021
  GetPublicProductBySlugUseCase,
  GetPublicProductDetailUseCase,
  ListPublicProductVariantsUseCase,
  ListPublicCollectionsUseCase,
  ListPublicCollectionProductsUseCase,
];

@Module({
  controllers: [
    ProductsController,
    ProductVariantsController,
    ProductMediaController,
    ProductSpecificationsController,
    ProductRelationsController,
    CategoriesController,
    CollectionsController,
    BrandsController,
    TagsController,
    ColorsController,
    SizesController,
    StorefrontCatalogController,
  ],
  providers: [...REPOSITORY_PROVIDERS, ...USE_CASE_PROVIDERS],
  // PRODUCT_VARIANT_REPOSITORY is exported (in addition to use-cases) so
  // the Inventory module can verify a variantId actually exists before
  // tracking stock against it — docs/06-DDD-BOUNDED-CONTEXTS.md's
  // Inventory section explicitly names this as a real dependency
  // ("a ProductVariant must exist to hold stock").
  // PRODUCT_REPOSITORY is exported for the same reason, this time for
  // Checkout: docs/06-DDD-BOUNDED-CONTEXTS.md's Orders section names
  // "Catalog (line-item snapshot at time of purchase)" as a real
  // dependency — Checkout needs Product.name/price/discountPrice/
  // currencyCode to snapshot OrderItem fields at checkout time (see
  // docs/v2/adr/0015). These two remain the only repositories exported —
  // not a general opening of Catalog's persistence internals.
  exports: [...USE_CASE_PROVIDERS, PRODUCT_VARIANT_REPOSITORY, PRODUCT_REPOSITORY],
})
export class CatalogModule {}
