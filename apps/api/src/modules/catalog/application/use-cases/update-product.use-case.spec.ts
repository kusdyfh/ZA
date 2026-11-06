import { UpdateProductUseCase } from './update-product.use-case';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { CategoryRepository } from '../../domain/repositories/category.repository';
import type { BrandRepository } from '../../domain/repositories/brand.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import {
  Product,
  type ProductProps,
} from '../../domain/entities/product.entity';
import {
  Category,
  type CategoryProps,
} from '../../domain/entities/category.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import { PRODUCT_PLACEMENT } from '../../domain/constants/product-placement.constants';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';

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
    placements: [PRODUCT_PLACEMENT.HOME_HERO],
    seo: SeoMetadata.create({}),
    highlights: [],
    richContent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

const BASE_INPUT = {
  productId: 'prod-1',
  name: 'Product',
  sku: 'SKU-1',
  price: 100,
  categoryId: 'cat-1',
};

describe('UpdateProductUseCase', () => {
  let products: jest.Mocked<ProductRepository>;
  let categories: jest.Mocked<CategoryRepository>;
  let brands: jest.Mocked<BrandRepository>;
  let storeContext: StoreContext;
  let useCase: UpdateProductUseCase;

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
    } as unknown as StoreContext;
    useCase = new UpdateProductUseCase(
      products,
      categories,
      brands,
      storeContext,
    );

    categories.findById.mockResolvedValue(buildCategory());
    products.findBySlug.mockResolvedValue(null);
    products.findBySku.mockResolvedValue(null);
    products.save.mockResolvedValue(undefined);
  });

  it('throws ProductNotFoundError when the product does not exist', async () => {
    products.findById.mockResolvedValue(null);
    await expect(useCase.execute(BASE_INPUT)).rejects.toThrow(
      ProductNotFoundError,
    );
  });

  it('replaces the homepage placements when given', async () => {
    const product = buildProduct();
    products.findById.mockResolvedValue(product);

    await useCase.execute({
      ...BASE_INPUT,
      placements: [
        PRODUCT_PLACEMENT.ART_STORY_WALL,
        PRODUCT_PLACEMENT.DOLL_DRESS_UP,
      ],
    });

    expect(product.placements).toEqual([
      PRODUCT_PLACEMENT.ART_STORY_WALL,
      PRODUCT_PLACEMENT.DOLL_DRESS_UP,
    ]);
    expect(products.save).toHaveBeenCalledWith(product);
  });

  it('leaves placements untouched when omitted from the input', async () => {
    const product = buildProduct({
      placements: [PRODUCT_PLACEMENT.ZA_EDIT_BOOK],
    });
    products.findById.mockResolvedValue(product);

    await useCase.execute(BASE_INPUT);

    expect(product.placements).toEqual([PRODUCT_PLACEMENT.ZA_EDIT_BOOK]);
  });

  it('clears every placement when given an explicit empty array', async () => {
    const product = buildProduct({ placements: [PRODUCT_PLACEMENT.HOME_HERO] });
    products.findById.mockResolvedValue(product);

    await useCase.execute({ ...BASE_INPUT, placements: [] });

    expect(product.placements).toEqual([]);
  });
});
