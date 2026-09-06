import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { ProductVariant } from '../../domain/entities/product-variant.entity';
import { Money } from '../../domain/value-objects/money.vo';
import {
  PRODUCT_VARIANT_REPOSITORY,
  type ProductVariantRepository,
} from '../../domain/repositories/product-variant.repository';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/repositories/product.repository';
import { COLOR_REPOSITORY, type ColorRepository } from '../../domain/repositories/color.repository';
import { SIZE_REPOSITORY, type SizeRepository } from '../../domain/repositories/size.repository';
import { ProductPolicy } from '../../domain/policies/product-policy';
import {
  ColorNotFoundError,
  ProductNotFoundError,
  SizeNotFoundError,
  SkuAlreadyInUseError,
  VariantBarcodeAlreadyInUseError,
} from '../../domain/errors/catalog.errors';

export interface CreateProductVariantInput {
  productId: string;
  sku: string;
  barcode?: string | null;
  colorId?: string | null;
  sizeId?: string | null;
  priceOverride?: number | null;
}

@Injectable()
export class CreateProductVariantUseCase {
  constructor(
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(COLOR_REPOSITORY) private readonly colors: ColorRepository,
    @Inject(SIZE_REPOSITORY) private readonly sizes: SizeRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: CreateProductVariantInput): Promise<ProductVariant> {
    const storeId = await this.storeContext.getCurrentStoreId();

    const product = await this.products.findById(storeId, input.productId);
    if (!product) {
      throw new ProductNotFoundError(input.productId);
    }

    const colorId = input.colorId ?? null;
    const sizeId = input.sizeId ?? null;

    if (colorId && !(await this.colors.findById(storeId, colorId))) {
      throw new ColorNotFoundError(colorId);
    }
    if (sizeId && !(await this.sizes.findById(storeId, sizeId))) {
      throw new SizeNotFoundError(sizeId);
    }

    const sku = ProductVariant.validateSku(input.sku);
    const existingBySku = await this.variants.findBySku(storeId, sku);
    if (existingBySku) {
      throw new SkuAlreadyInUseError(sku);
    }

    const barcode = input.barcode?.trim() || null;
    if (barcode) {
      const existingByBarcode = await this.variants.findByBarcode(storeId, barcode);
      if (existingByBarcode) {
        throw new VariantBarcodeAlreadyInUseError(barcode);
      }
    }

    const existingVariants = await this.variants.listByProduct(storeId, input.productId);
    ProductPolicy.assertNoDuplicateVariantAttributes(existingVariants, { colorId, sizeId });

    const priceOverride =
      input.priceOverride !== undefined && input.priceOverride !== null
        ? Money.create(input.priceOverride, product.price.currency)
        : null;

    return this.variants.create({
      storeId,
      productId: input.productId,
      sku,
      barcode,
      colorId,
      sizeId,
      priceOverride,
    });
  }
}
