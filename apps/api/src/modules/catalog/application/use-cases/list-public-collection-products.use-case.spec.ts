import { ListPublicCollectionProductsUseCase } from './list-public-collection-products.use-case';
import type { ListCollectionProductsUseCase } from './list-collection-products.use-case';
import { Product, type ProductProps } from '../../domain/entities/product.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';

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

describe('ListPublicCollectionProductsUseCase', () => {
  let listCollectionProducts: jest.Mocked<ListCollectionProductsUseCase>;
  let useCase: ListPublicCollectionProductsUseCase;

  beforeEach(() => {
    listCollectionProducts = { execute: jest.fn() } as unknown as jest.Mocked<ListCollectionProductsUseCase>;
    useCase = new ListPublicCollectionProductsUseCase(listCollectionProducts);
  });

  it('delegates to ListCollectionProductsUseCase and keeps only ACTIVE products', async () => {
    listCollectionProducts.execute.mockResolvedValue([
      buildProduct({ id: 'active-1', status: PRODUCT_STATUS.ACTIVE }),
      buildProduct({ id: 'draft-1', status: PRODUCT_STATUS.DRAFT }),
      buildProduct({ id: 'archived-1', status: PRODUCT_STATUS.ARCHIVED }),
    ]);

    const result = await useCase.execute({ collectionId: 'col-1' });

    expect(result.map((p) => p.id)).toEqual(['active-1']);
    expect(listCollectionProducts.execute).toHaveBeenCalledWith({ collectionId: 'col-1' });
  });

  it('propagates errors from the delegated use-case (e.g. CollectionNotFoundError)', async () => {
    const error = new Error('boom');
    listCollectionProducts.execute.mockRejectedValue(error);
    await expect(useCase.execute({ collectionId: 'missing' })).rejects.toThrow(error);
  });
});
