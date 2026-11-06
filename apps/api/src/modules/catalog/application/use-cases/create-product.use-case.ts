import { Inject, Injectable } from '@nestjs/common';
import { slugify } from '@za/shared';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import type { Product } from '../../domain/entities/product.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { ProductPolicy } from '../../domain/policies/product-policy';
import type { ProductPlacementValue } from '../../domain/constants/product-placement.constants';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../domain/repositories/product.repository';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
} from '../../domain/repositories/category.repository';
import {
  BRAND_REPOSITORY,
  type BrandRepository,
} from '../../domain/repositories/brand.repository';
import {
  BrandNotFoundError,
  CategoryNotFoundError,
  SkuAlreadyInUseError,
  SlugAlreadyInUseError,
} from '../../domain/errors/catalog.errors';

export interface CreateProductInput {
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
  placements?: ProductPlacementValue[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
  highlights?: string[];
  richContent?: string | null;
}

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const name = ProductPolicy.validateName(input.name);
    const sku = ProductPolicy.validateSku(input.sku);

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

    const skuCheck = this.products.findBySku(storeId, sku);

    let slug: Slug;
    if (input.slug) {
      slug = Slug.fromRaw(input.slug);
      const existingBySlug = await this.products.findBySlug(
        storeId,
        slug.toString(),
      );
      if (existingBySlug) {
        throw new SlugAlreadyInUseError(slug.toString());
      }
    } else {
      slug = await this.generateUniqueSlug(storeId, name);
    }

    const existingBySku = await skuCheck;
    if (existingBySku) {
      throw new SkuAlreadyInUseError(sku);
    }

    const currencyCode = await this.storeContext.getDefaultCurrency();
    const price = Money.create(input.price, currencyCode);
    const discountPrice =
      input.discountPrice !== undefined && input.discountPrice !== null
        ? Money.create(input.discountPrice, currencyCode)
        : null;
    ProductPolicy.validatePricing(price, discountPrice);

    const seo = SeoMetadata.create({
      metaTitle: input.metaTitle ?? name,
      metaDescription:
        input.metaDescription ??
        input.shortDescription ??
        input.description ??
        null,
      ogImageUrl: input.ogImageUrl ?? null,
    });

    return this.products.create({
      storeId,
      name,
      slug,
      sku,
      shortDescription: input.shortDescription ?? null,
      description: input.description ?? null,
      price,
      discountPrice,
      categoryId: input.categoryId,
      brandId: input.brandId ?? null,
      isFeatured: input.isFeatured ?? false,
      isBestSeller: input.isBestSeller ?? false,
      isNewArrival: input.isNewArrival ?? false,
      isGiftBox: input.isGiftBox ?? false,
      placements: input.placements ?? [],
      seo,
      highlights: input.highlights ?? [],
      richContent: input.richContent ?? null,
    });
  }

  /**
   * Names that `slugify` strips down to nothing (e.g. names written
   * entirely in a non-Latin script) fall back to "product" so the slug
   * is never empty; a numeric suffix is appended until the candidate
   * is free, so same-named products never collide.
   */
  private async generateUniqueSlug(
    storeId: string,
    name: string,
  ): Promise<Slug> {
    const base = slugify(name) || 'product';
    let candidate = base;
    let attempt = 2;
    while (await this.products.findBySlug(storeId, candidate)) {
      candidate = `${base}-${attempt}`;
      attempt += 1;
    }
    return Slug.fromRaw(candidate);
  }
}
