import { CreateProductVariantUseCase } from './create-product-variant.use-case';
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
import {
  ColorNotFoundError,
  DuplicateVariantAttributesError,
  ProductNotFoundError,
  SizeNotFoundError,
  SkuAlreadyInUseError,
  VariantBarcodeAlreadyInUseError,
} from '../../domain/errors/catalog.errors';

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
    id: 'variant-existing',
    storeId: 'store-1',
    productId: 'prod-1',
    sku: 'SKU-EXISTING',
    barcode: null,
    colorId: 'color-1',
    sizeId: 'size-1',
    priceOverride: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('CreateProductVariantUseCase', () => {
  let variants: jest.Mocked<ProductVariantRepository>;
  let products: jest.Mocked<ProductRepository>;
  let colors: jest.Mocked<ColorRepository>;
  let sizes: jest.Mocked<SizeRepository>;
  let storeContext: StoreContext;
  let useCase: CreateProductVariantUseCase;

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
    useCase = new CreateProductVariantUseCase(variants, products, colors, sizes, storeContext);
  });

  it('creates a variant when everything is valid', async () => {
    products.findById.mockResolvedValue(buildProduct());
    colors.findById.mockResolvedValue(buildColor());
    sizes.findById.mockResolvedValue(buildSize());
    variants.findBySku.mockResolvedValue(null);
    variants.listByProduct.mockResolvedValue([]);
    variants.create.mockResolvedValue(buildVariant());

    await useCase.execute({
      productId: 'prod-1',
      sku: 'NEW-SKU',
      colorId: 'color-1',
      sizeId: 'size-1',
    });

    expect(variants.create).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: 'store-1', productId: 'prod-1', sku: 'NEW-SKU' }),
    );
  });

  it('throws ProductNotFoundError when the product does not exist', async () => {
    products.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ productId: 'missing', sku: 'SKU' }),
    ).rejects.toThrow(ProductNotFoundError);
  });

  it('throws ColorNotFoundError when the given color does not exist', async () => {
    products.findById.mockResolvedValue(buildProduct());
    colors.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ productId: 'prod-1', sku: 'SKU', colorId: 'missing' }),
    ).rejects.toThrow(ColorNotFoundError);
  });

  it('throws SizeNotFoundError when the given size does not exist', async () => {
    products.findById.mockResolvedValue(buildProduct());
    sizes.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ productId: 'prod-1', sku: 'SKU', sizeId: 'missing' }),
    ).rejects.toThrow(SizeNotFoundError);
  });

  it('throws SkuAlreadyInUseError when the SKU is taken', async () => {
    products.findById.mockResolvedValue(buildProduct());
    variants.findBySku.mockResolvedValue(buildVariant());
    await expect(
      useCase.execute({ productId: 'prod-1', sku: 'SKU-EXISTING' }),
    ).rejects.toThrow(SkuAlreadyInUseError);
  });

  it('throws VariantBarcodeAlreadyInUseError when the barcode is taken', async () => {
    products.findById.mockResolvedValue(buildProduct());
    variants.findBySku.mockResolvedValue(null);
    variants.findByBarcode.mockResolvedValue(buildVariant({ barcode: '12345' }));
    await expect(
      useCase.execute({ productId: 'prod-1', sku: 'NEW-SKU', barcode: '12345' }),
    ).rejects.toThrow(VariantBarcodeAlreadyInUseError);
  });

  it('throws DuplicateVariantAttributesError for a repeated color+size combination', async () => {
    products.findById.mockResolvedValue(buildProduct());
    colors.findById.mockResolvedValue(buildColor());
    sizes.findById.mockResolvedValue(buildSize());
    variants.findBySku.mockResolvedValue(null);
    variants.listByProduct.mockResolvedValue([buildVariant()]);

    await expect(
      useCase.execute({ productId: 'prod-1', sku: 'NEW-SKU', colorId: 'color-1', sizeId: 'size-1' }),
    ).rejects.toThrow(DuplicateVariantAttributesError);
    expect(variants.create).not.toHaveBeenCalled();
  });
});
