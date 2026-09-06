import { GetPublicProductDetailUseCase } from './get-public-product-detail.use-case';
import type { GetPublicProductBySlugUseCase } from './get-public-product-by-slug.use-case';
import type { GetProductDetailUseCase } from './get-product-detail.use-case';
import type { ListProductRelationsUseCase } from './list-product-relations.use-case';
import { Product, type ProductProps } from '../../domain/entities/product.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import { PRODUCT_RELATION_TYPE } from '../../domain/constants/product-relation-type.constants';

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

describe('GetPublicProductDetailUseCase', () => {
  let getPublicProductBySlug: jest.Mocked<GetPublicProductBySlugUseCase>;
  let getProductDetail: jest.Mocked<GetProductDetailUseCase>;
  let listProductRelations: jest.Mocked<ListProductRelationsUseCase>;
  let useCase: GetPublicProductDetailUseCase;

  beforeEach(() => {
    getPublicProductBySlug = { execute: jest.fn() } as unknown as jest.Mocked<GetPublicProductBySlugUseCase>;
    getProductDetail = { execute: jest.fn() } as unknown as jest.Mocked<GetProductDetailUseCase>;
    listProductRelations = { execute: jest.fn() } as unknown as jest.Mocked<ListProductRelationsUseCase>;
    useCase = new GetPublicProductDetailUseCase(getPublicProductBySlug, getProductDetail, listProductRelations);
  });

  it('composes the slug resolution, product detail, and all three relation types', async () => {
    const product = buildProduct();
    const related = [buildProduct({ id: 'related-1' })];
    const crossSell = [buildProduct({ id: 'cross-1' })];
    const upSell = [buildProduct({ id: 'up-1' })];

    getPublicProductBySlug.execute.mockResolvedValue(product);
    getProductDetail.execute.mockResolvedValue({ product, variants: [], media: [], specifications: [] });
    listProductRelations.execute.mockImplementation(({ type }) => {
      if (type === PRODUCT_RELATION_TYPE.RELATED) return Promise.resolve(related);
      if (type === PRODUCT_RELATION_TYPE.CROSS_SELL) return Promise.resolve(crossSell);
      return Promise.resolve(upSell);
    });

    const result = await useCase.execute({ slug: 'product' });

    expect(getPublicProductBySlug.execute).toHaveBeenCalledWith({ slug: 'product' });
    expect(getProductDetail.execute).toHaveBeenCalledWith({ productId: product.id });
    expect(listProductRelations.execute).toHaveBeenCalledWith({
      productId: product.id,
      type: PRODUCT_RELATION_TYPE.RELATED,
    });
    expect(listProductRelations.execute).toHaveBeenCalledWith({
      productId: product.id,
      type: PRODUCT_RELATION_TYPE.CROSS_SELL,
    });
    expect(listProductRelations.execute).toHaveBeenCalledWith({
      productId: product.id,
      type: PRODUCT_RELATION_TYPE.UP_SELL,
    });
    expect(result.related).toEqual(related);
    expect(result.crossSell).toEqual(crossSell);
    expect(result.upSell).toEqual(upSell);
    expect(result.product).toBe(product);
  });

  it('propagates ProductNotFoundError from the slug resolution without calling the other use-cases', async () => {
    const error = new Error('not found');
    getPublicProductBySlug.execute.mockRejectedValue(error);

    await expect(useCase.execute({ slug: 'missing' })).rejects.toThrow(error);
    expect(getProductDetail.execute).not.toHaveBeenCalled();
    expect(listProductRelations.execute).not.toHaveBeenCalled();
  });
});
