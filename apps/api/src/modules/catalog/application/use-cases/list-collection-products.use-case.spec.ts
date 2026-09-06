import { ListCollectionProductsUseCase } from './list-collection-products.use-case';
import type { CollectionRepository } from '../../domain/repositories/collection.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Collection, type CollectionProps } from '../../domain/entities/collection.entity';
import { Product, type ProductProps } from '../../domain/entities/product.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import { CollectionNotFoundError } from '../../domain/errors/catalog.errors';

function buildCollection(overrides: Partial<CollectionProps> = {}): Collection {
  return Collection.reconstitute({
    id: 'col-1',
    storeId: 'store-1',
    name: 'Collection',
    slug: Slug.fromRaw('collection'),
    description: null,
    isActive: true,
    startsAt: null,
    endsAt: null,
    seo: SeoMetadata.create({}),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildProduct(overrides: Partial<ProductProps> = {}): Product {
  return Product.reconstitute({
    id: overrides.id ?? 'prod-1',
    storeId: 'store-1',
    name: overrides.id ?? 'Product',
    slug: Slug.fromRaw(overrides.id ?? 'product'),
    sku: overrides.id ?? 'SKU-1',
    shortDescription: null,
    description: null,
    status: PRODUCT_STATUS.ACTIVE,
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

describe('ListCollectionProductsUseCase', () => {
  let collections: jest.Mocked<CollectionRepository>;
  let storeContext: StoreContext;
  let useCase: ListCollectionProductsUseCase;

  beforeEach(() => {
    collections = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
      replaceProducts: jest.fn(),
      listProducts: jest.fn(),
    };
    storeContext = {
      getCurrentStoreId: jest.fn().mockResolvedValue('store-1'),
    } as unknown as StoreContext;
    useCase = new ListCollectionProductsUseCase(collections, storeContext);
  });

  it('throws CollectionNotFoundError when the collection does not exist', async () => {
    collections.findById.mockResolvedValue(null);
    await expect(useCase.execute({ collectionId: 'missing' })).rejects.toThrow(
      CollectionNotFoundError,
    );
  });

  it('excludes archived products from the live listing', async () => {
    collections.findById.mockResolvedValue(buildCollection());
    collections.listProducts.mockResolvedValue([
      { product: buildProduct({ id: 'active-1', status: PRODUCT_STATUS.ACTIVE }), sortOrder: 0 },
      { product: buildProduct({ id: 'archived-1', status: PRODUCT_STATUS.ARCHIVED }), sortOrder: 1 },
    ]);

    const result = await useCase.execute({ collectionId: 'col-1' });

    expect(result.map((p) => p.id)).toEqual(['active-1']);
  });

  it('returns products ordered by sortOrder', async () => {
    collections.findById.mockResolvedValue(buildCollection());
    collections.listProducts.mockResolvedValue([
      { product: buildProduct({ id: 'second' }), sortOrder: 1 },
      { product: buildProduct({ id: 'first' }), sortOrder: 0 },
    ]);

    const result = await useCase.execute({ collectionId: 'col-1' });

    expect(result.map((p) => p.id)).toEqual(['first', 'second']);
  });
});
