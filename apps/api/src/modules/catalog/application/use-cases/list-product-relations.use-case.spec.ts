import { ListProductRelationsUseCase } from './list-product-relations.use-case';
import type { ProductRelationRepository } from '../../domain/repositories/product-relation.repository';
import { Product, type ProductProps } from '../../domain/entities/product.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import { PRODUCT_RELATION_TYPE } from '../../domain/constants/product-relation-type.constants';

function buildProduct(overrides: Partial<ProductProps> = {}): Product {
  return Product.reconstitute({
    id: overrides.id ?? 'prod-2',
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

describe('ListProductRelationsUseCase', () => {
  let relations: jest.Mocked<ProductRelationRepository>;
  let useCase: ListProductRelationsUseCase;

  beforeEach(() => {
    relations = { replace: jest.fn(), listRelatedProducts: jest.fn() };
    useCase = new ListProductRelationsUseCase(relations);
  });

  it('excludes archived related products from the result', async () => {
    relations.listRelatedProducts.mockResolvedValue([
      buildProduct({ id: 'active-1', status: PRODUCT_STATUS.ACTIVE }),
      buildProduct({ id: 'archived-1', status: PRODUCT_STATUS.ARCHIVED }),
    ]);

    const result = await useCase.execute({
      productId: 'prod-1',
      type: PRODUCT_RELATION_TYPE.CROSS_SELL,
    });

    expect(result.map((p) => p.id)).toEqual(['active-1']);
    expect(relations.listRelatedProducts).toHaveBeenCalledWith(
      'prod-1',
      PRODUCT_RELATION_TYPE.CROSS_SELL,
    );
  });
});
