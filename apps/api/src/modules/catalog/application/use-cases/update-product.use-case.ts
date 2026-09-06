import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import type { Product } from '../../domain/entities/product.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { ProductPolicy } from '../../domain/policies/product-policy';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/repositories/product.repository';
import { CATEGORY_REPOSITORY, type CategoryRepository } from '../../domain/repositories/category.repository';
import { BRAND_REPOSITORY, type BrandRepository } from '../../domain/repositories/brand.repository';
import {
  BrandNotFoundError,
  CategoryNotFoundError,
  ProductNotFoundError,
  SkuAlreadyInUseError,
  SlugAlreadyInUseError,
} from '../../domain/errors/catalog.errors';

export interface UpdateProductInput {
  productId: string;
  name: string;
  slug?: string;
  sku: string;
  shortDescription?: string | null;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  categoryId: string;
  brandId?: string | null;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isGiftBox?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
  highlights?: string[];
  richContent?: string | null;
}

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepository,
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: UpdateProductInput): Promise<Product> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const product = await this.products.findById(storeId, input.productId);
    if (!product) {
      throw new ProductNotFoundError(input.productId);
    }

    const category = await this.categories.findById(storeId, input.categoryId);
    if (!category) {
      throw new CategoryNotFoundError(input.categoryId);
    }

    if (input.brandId) {
      const brand = await this.brands.findById(storeId, input.brandId);
      if (!brand) {
        throw new BrandNotFoundError(input.brandId);
      }
    }

    const name = ProductPolicy.validateName(input.name);
    const sku = ProductPolicy.validateSku(input.sku);
    const slug = input.slug ? Slug.fromRaw(input.slug) : Slug.fromName(name);

    if (!slug.equals(product.slug)) {
      const existing = await this.products.findBySlug(storeId, slug.toString());
      if (existing) {
        throw new SlugAlreadyInUseError(slug.toString());
      }
    }
    if (sku !== product.sku) {
      const existing = await this.products.findBySku(storeId, sku);
      if (existing) {
        throw new SkuAlreadyInUseError(sku);
      }
    }

    const currencyCode = product.price.currency;
    const price = Money.create(input.price, currencyCode);
    const discountPrice =
      input.discountPrice !== undefined && input.discountPrice !== null
        ? Money.create(input.discountPrice, currencyCode)
        : null;

    product.rename(name);
    product.changeSlug(slug);
    product.changeSku(sku);
    product.updateDescriptions(input.shortDescription ?? null, input.description ?? null);
    product.updatePricing(price, discountPrice);
    product.assignCategory(input.categoryId);
    product.assignBrand(input.brandId ?? null);
    product.setMerchandisingFlags({
      isFeatured: input.isFeatured,
      isBestSeller: input.isBestSeller,
      isNewArrival: input.isNewArrival,
      isGiftBox: input.isGiftBox,
    });
    product.updateSeo(
      SeoMetadata.create({
        metaTitle: input.metaTitle ?? name,
        metaDescription: input.metaDescription ?? input.shortDescription ?? input.description ?? null,
        ogImageUrl: input.ogImageUrl ?? product.seo.ogImageUrl,
      }),
    );
    if (input.highlights !== undefined) {
      product.updateHighlights(input.highlights);
    }
    if (input.richContent !== undefined) {
      product.updateRichContent(input.richContent);
    }

    await this.products.save(product);
    return product;
  }
}
