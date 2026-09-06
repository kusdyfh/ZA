import { GetPublicProductBySlugUseCase } from './get-public-product-by-slug.use-case';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Product, type ProductProps } from '../../domain/entities/product.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';

function buildProduct(overrides: Partial<ProductProps> = {}): Product {
  return Product.reconstitute({
    id: 'prod-1',
    storeId: 'store-1',
    name: 'Product',
    slug: Slug.fromRaw('product'),
    sku: 'SKU-1',
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

describe('GetPublicProductBySlugUseCase', () => {
  let products: jest.Mocked<ProductRepository>;
  let storeContext: StoreContext;
  let useCase: GetPublicProductBySlugUseCase;

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
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    useCase = new GetPublicProductBySlugUseCase(products, storeContext);
  });

  it('returns the product when found and ACTIVE', async () => {
    const product = buildProduct();
    products.findBySlug.mockResolvedValue(product);

    const result = await useCase.execute({ slug: 'product' });

    expect(result).toBe(product);
    expect(products.findBySlug).toHaveBeenCalledWith('store-1', 'product');
  });

  it('throws ProductNotFoundError when no product exists at that slug', async () => {
    products.findBySlug.mockResolvedValue(null);
    await expect(useCase.execute({ slug: 'missing' })).rejects.toThrow(ProductNotFoundError);
  });

  it.each([PRODUCT_STATUS.DRAFT, PRODUCT_STATUS.ARCHIVED])(
    'throws ProductNotFoundError for a %s product (never reveals non-ACTIVE products)',
    async (status) => {
      products.findBySlug.mockResolvedValue(buildProduct({ status }));
      await expect(useCase.execute({ slug: 'product' })).rejects.toThrow(ProductNotFoundError);
    },
  );
});
