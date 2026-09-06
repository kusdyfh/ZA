import { SetCollectionProductsUseCase } from './set-collection-products.use-case';
import type { CollectionRepository } from '../../domain/repositories/collection.repository';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Collection, type CollectionProps } from '../../domain/entities/collection.entity';
import { Product, type ProductProps } from '../../domain/entities/product.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import {
  ArchivedProductNotAddableError,
  CollectionNotFoundError,
  ProductNotFoundError,
} from '../../domain/errors/catalog.errors';

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
    name: 'Product',
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

describe('SetCollectionProductsUseCase', () => {
  let collections: jest.Mocked<CollectionRepository>;
  let products: jest.Mocked<ProductRepository>;
  let storeContext: StoreContext;
  let useCase: SetCollectionProductsUseCase;

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
    storeContext = {
      getCurrentStoreId: jest.fn().mockResolvedValue('store-1'),
    } as unknown as StoreContext;
    useCase = new SetCollectionProductsUseCase(collections, products, storeContext);
  });

  it('throws CollectionNotFoundError when the collection does not exist', async () => {
    collections.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ collectionId: 'missing', productIds: [] }),
    ).rejects.toThrow(CollectionNotFoundError);
  });

  it('throws ProductNotFoundError when a product id does not exist', async () => {
    collections.findById.mockResolvedValue(buildCollection());
    products.findManyByIds.mockResolvedValue([]);

    await expect(
      useCase.execute({ collectionId: 'col-1', productIds: ['missing'] }),
    ).rejects.toThrow(ProductNotFoundError);
    expect(collections.replaceProducts).not.toHaveBeenCalled();
  });

  it('throws ArchivedProductNotAddableError when a product is archived', async () => {
    collections.findById.mockResolvedValue(buildCollection());
    products.findManyByIds.mockResolvedValue([
      buildProduct({ id: 'prod-1', status: PRODUCT_STATUS.ARCHIVED }),
    ]);

    await expect(
      useCase.execute({ collectionId: 'col-1', productIds: ['prod-1'] }),
    ).rejects.toThrow(ArchivedProductNotAddableError);
    expect(collections.replaceProducts).not.toHaveBeenCalled();
  });

  it('deduplicates product ids and replaces membership + order', async () => {
    collections.findById.mockResolvedValue(buildCollection());
    products.findManyByIds.mockResolvedValue([
      buildProduct({ id: 'prod-1' }),
      buildProduct({ id: 'prod-2' }),
    ]);

    await useCase.execute({ collectionId: 'col-1', productIds: ['prod-1', 'prod-2', 'prod-1'] });

    expect(collections.replaceProducts).toHaveBeenCalledWith('store-1', 'col-1', ['prod-1', 'prod-2']);
  });
});
