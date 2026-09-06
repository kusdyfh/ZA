import { CreateProductUseCase } from './create-product.use-case';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { CategoryRepository } from '../../domain/repositories/category.repository';
import type { BrandRepository } from '../../domain/repositories/brand.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Product, type ProductProps } from '../../domain/entities/product.entity';
import { Category, type CategoryProps } from '../../domain/entities/category.entity';
import { Brand, type BrandProps } from '../../domain/entities/brand.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import {
  BrandNotFoundError,
  CategoryNotFoundError,
  DiscountPriceNotLowerThanPriceError,
  SkuAlreadyInUseError,
  SlugAlreadyInUseError,
} from '../../domain/errors/catalog.errors';

function buildCategory(overrides: Partial<CategoryProps> = {}): Category {
  return Category.reconstitute({
    id: 'cat-1',
    storeId: 'store-1',
    name: 'Category',
    slug: Slug.fromRaw('category'),
    description: null,
    sortOrder: 0,
    isActive: true,
    parentId: null,
    seo: SeoMetadata.create({}),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildBrand(overrides: Partial<BrandProps> = {}): Brand {
  return Brand.reconstitute({
    id: 'brand-1',
    storeId: 'store-1',
    name: 'Brand',
    slug: Slug.fromRaw('brand'),
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

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

describe('CreateProductUseCase', () => {
  let products: jest.Mocked<ProductRepository>;
  let categories: jest.Mocked<CategoryRepository>;
  let brands: jest.Mocked<BrandRepository>;
  let storeContext: StoreContext;
  let useCase: CreateProductUseCase;

  beforeEach(() => {
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
    categories = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
      countChildren: jest.fn(),
      countProducts: jest.fn(),
    };
    brands = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
    };
    storeContext = {
      getCurrentStoreId: jest.fn().mockResolvedValue('store-1'),
      getDefaultCurrency: jest.fn().mockResolvedValue('IQD'),
    } as unknown as StoreContext;
    useCase = new CreateProductUseCase(products, categories, brands, storeContext);
  });

  it('creates a product when everything is valid, including an existing brand', async () => {
    categories.findById.mockResolvedValue(buildCategory());
    brands.findById.mockResolvedValue(buildBrand());
    products.findBySlug.mockResolvedValue(null);
    products.findBySku.mockResolvedValue(null);
    products.create.mockResolvedValue(buildProduct());

    await useCase.execute({
      name: 'Classic V-Neck Scrub Top',
      sku: 'ZA-TOP-001',
      price: 45000,
      discountPrice: 39000,
      categoryId: 'cat-1',
      brandId: 'brand-1',
    });

    expect(products.create).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: 'store-1', sku: 'ZA-TOP-001' }),
    );
  });

  it('throws CategoryNotFoundError when the category does not exist', async () => {
    categories.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ name: 'X', sku: 'SKU', price: 10, categoryId: 'missing' }),
    ).rejects.toThrow(CategoryNotFoundError);
    expect(products.create).not.toHaveBeenCalled();
  });

  it('throws BrandNotFoundError when the given brand does not exist', async () => {
    categories.findById.mockResolvedValue(buildCategory());
    brands.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ name: 'X', sku: 'SKU', price: 10, categoryId: 'cat-1', brandId: 'missing' }),
    ).rejects.toThrow(BrandNotFoundError);
  });

  it('throws SlugAlreadyInUseError when the slug is taken', async () => {
    categories.findById.mockResolvedValue(buildCategory());
    products.findBySlug.mockResolvedValue(buildProduct());

    await expect(
      useCase.execute({ name: 'X', sku: 'SKU', price: 10, categoryId: 'cat-1' }),
    ).rejects.toThrow(SlugAlreadyInUseError);
  });

  it('throws SkuAlreadyInUseError when the SKU is taken', async () => {
    categories.findById.mockResolvedValue(buildCategory());
    products.findBySlug.mockResolvedValue(null);
    products.findBySku.mockResolvedValue(buildProduct());

    await expect(
      useCase.execute({ name: 'X', sku: 'SKU', price: 10, categoryId: 'cat-1' }),
    ).rejects.toThrow(SkuAlreadyInUseError);
  });

  it('throws DiscountPriceNotLowerThanPriceError when the discount is not lower', async () => {
    categories.findById.mockResolvedValue(buildCategory());
    products.findBySlug.mockResolvedValue(null);
    products.findBySku.mockResolvedValue(null);

    await expect(
      useCase.execute({
        name: 'X',
        sku: 'SKU',
        price: 100,
        discountPrice: 150,
        categoryId: 'cat-1',
      }),
    ).rejects.toThrow(DiscountPriceNotLowerThanPriceError);
  });
});
