import { SetProductRelationsUseCase } from './set-product-relations.use-case';
import type { ProductRelationRepository } from '../../domain/repositories/product-relation.repository';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Product, type ProductProps } from '../../domain/entities/product.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import { PRODUCT_RELATION_TYPE } from '../../domain/constants/product-relation-type.constants';
import { ProductNotFoundError, SelfProductRelationError } from '../../domain/errors/catalog.errors';

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

describe('SetProductRelationsUseCase', () => {
  let relations: jest.Mocked<ProductRelationRepository>;
  let products: jest.Mocked<ProductRepository>;
  let storeContext: StoreContext;
  let useCase: SetProductRelationsUseCase;

  beforeEach(() => {
    relations = { replace: jest.fn(), listRelatedProducts: jest.fn() };
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
    useCase = new SetProductRelationsUseCase(relations, products, storeContext);
  });

  it('throws ProductNotFoundError when the product does not exist', async () => {
    products.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ productId: 'missing', type: PRODUCT_RELATION_TYPE.RELATED, relatedProductIds: [] }),
    ).rejects.toThrow(ProductNotFoundError);
  });

  it('throws SelfProductRelationError when a product is related to itself', async () => {
    products.findById.mockResolvedValue(buildProduct({ id: 'prod-1' }));
    await expect(
      useCase.execute({
        productId: 'prod-1',
        type: PRODUCT_RELATION_TYPE.CROSS_SELL,
        relatedProductIds: ['prod-1'],
      }),
    ).rejects.toThrow(SelfProductRelationError);
  });

  it('throws ProductNotFoundError when a related product id does not exist', async () => {
    products.findById.mockResolvedValue(buildProduct({ id: 'prod-1' }));
    products.findManyByIds.mockResolvedValue([]);
    await expect(
      useCase.execute({
        productId: 'prod-1',
        type: PRODUCT_RELATION_TYPE.UP_SELL,
        relatedProductIds: ['missing'],
      }),
    ).rejects.toThrow(ProductNotFoundError);
    expect(relations.replace).not.toHaveBeenCalled();
  });

  it('deduplicates ids and replaces relations of the given type', async () => {
    products.findById.mockResolvedValue(buildProduct({ id: 'prod-1' }));
    products.findManyByIds.mockResolvedValue([
      buildProduct({ id: 'prod-2' }),
      buildProduct({ id: 'prod-3' }),
    ]);

    await useCase.execute({
      productId: 'prod-1',
      type: PRODUCT_RELATION_TYPE.RELATED,
      relatedProductIds: ['prod-2', 'prod-3', 'prod-2'],
    });

    expect(relations.replace).toHaveBeenCalledWith('prod-1', PRODUCT_RELATION_TYPE.RELATED, [
      'prod-2',
      'prod-3',
    ]);
  });
});
