import { UpdateProductVariantUseCase } from './update-product-variant.use-case';
import type { ProductVariantRepository } from '../../domain/repositories/product-variant.repository';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { ColorRepository } from '../../domain/repositories/color.repository';
import type { SizeRepository } from '../../domain/repositories/size.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Product, type ProductProps } from '../../domain/entities/product.entity';
import { ProductVariant, type ProductVariantProps } from '../../domain/entities/product-variant.entity';
import { Color, type ColorProps } from '../../domain/entities/color.entity';
import { Size, type SizeProps } from '../../domain/entities/size.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import { ProductVariantNotFoundError, SkuAlreadyInUseError } from '../../domain/errors/catalog.errors';

function buildProduct(overrides: Partial<ProductProps> = {}): Product {
  return Product.reconstitute({
    id: 'prod-1',
    storeId: 'store-1',
    name: 'Product',
    slug: Slug.fromRaw('product'),
    sku: 'SKU-1',
    shortDescription: null,
    description: null,
    status: PRODUCT_STATUS.DRAFT,
    price: Money.create(100, 'IQD'),
    discountPrice: null,
    categoryId: 'cat-1',
    brandId: null,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isGiftBox: false,
    seo: SeoMetadata.create({}),
    highlights: [],
    richContent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildColor(overrides: Partial<ColorProps> = {}): Color {
  return Color.reconstitute({
    id: 'color-1',
    storeId: 'store-1',
    name: 'Navy',
    hexCode: '#1B2A4A',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildSize(overrides: Partial<SizeProps> = {}): Size {
  return Size.reconstitute({
    id: 'size-1',
    storeId: 'store-1',
    label: 'M',
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildVariant(overrides: Partial<ProductVariantProps> = {}): ProductVariant {
  return ProductVariant.reconstitute({
    id: 'variant-1',
    storeId: 'store-1',
    productId: 'prod-1',
    sku: 'SKU-A',
    barcode: null,
    colorId: 'color-1',
    sizeId: 'size-1',
    priceOverride: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('UpdateProductVariantUseCase', () => {
  let variants: jest.Mocked<ProductVariantRepository>;
  let products: jest.Mocked<ProductRepository>;
  let colors: jest.Mocked<ColorRepository>;
  let sizes: jest.Mocked<SizeRepository>;
  let storeContext: StoreContext;
  let useCase: UpdateProductVariantUseCase;

  beforeEach(() => {
    variants = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findBySku: jest.fn(),
      findByBarcode: jest.fn(),
      listByProduct: jest.fn(),
      countByProduct: jest.fn(),
      delete: jest.fn(),
    };
    products = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findBySku: jest.fn(),
      findManyByIds: jest.fn(),
      list: jest.fn(),
      replaceTags: jest.fn(),
      listTagIds: jest.fn(),
    };
    colors = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
    };
    sizes = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByLabel: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
    };
    storeContext = {
      getCurrentStoreId: jest.fn().mockResolvedValue('store-1'),
    } as unknown as StoreContext;
    useCase = new UpdateProductVariantUseCase(variants, products, colors, sizes, storeContext);
  });

  it('throws ProductVariantNotFoundError when the variant does not exist', async () => {
    variants.findById.mockResolvedValue(null);
    await expect(useCase.execute({ variantId: 'missing', sku: 'SKU' })).rejects.toThrow(
      ProductVariantNotFoundError,
    );
  });

  it('does not treat the variant being updated as a duplicate of itself', async () => {
    const variant = buildVariant();
    variants.findById.mockResolvedValue(variant);
    products.findById.mockResolvedValue(buildProduct());
    colors.findById.mockResolvedValue(buildColor());
    sizes.findById.mockResolvedValue(buildSize());
    variants.listByProduct.mockResolvedValue([variant]);

    await useCase.execute({
      variantId: 'variant-1',
      sku: 'SKU-A',
      colorId: 'color-1',
      sizeId: 'size-1',
    });

    expect(variants.save).toHaveBeenCalledWith(variant);
  });

  it('throws SkuAlreadyInUseError when changing to a SKU already used by another variant', async () => {
    const variant = buildVariant();
    variants.findById.mockResolvedValue(variant);
    products.findById.mockResolvedValue(buildProduct());
    variants.findBySku.mockResolvedValue(buildVariant({ id: 'other-variant', sku: 'SKU-B' }));

    await expect(
      useCase.execute({ variantId: 'variant-1', sku: 'SKU-B' }),
    ).rejects.toThrow(SkuAlreadyInUseError);
  });

  it('updates the price override using the product currency', async () => {
    const variant = buildVariant();
    variants.findById.mockResolvedValue(variant);
    products.findById.mockResolvedValue(buildProduct());
    colors.findById.mockResolvedValue(buildColor());
    sizes.findById.mockResolvedValue(buildSize());
    variants.listByProduct.mockResolvedValue([variant]);

    const result = await useCase.execute({
      variantId: 'variant-1',
      sku: 'SKU-A',
      colorId: 'color-1',
      sizeId: 'size-1',
      priceOverride: 120,
    });

    expect(result.priceOverride?.toNumber()).toBe(120);
    expect(result.priceOverride?.currency).toBe('IQD');
  });
});
