import { ChangeProductStatusUseCase } from './change-product-status.use-case';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { ProductVariantRepository } from '../../domain/repositories/product-variant.repository';
import type { ProductMediaItem, ProductMediaRepository } from '../../domain/repositories/product-media.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Product, type ProductProps } from '../../domain/entities/product.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import { PRODUCT_MEDIA_TYPE } from '../../domain/constants/product-media-type.constants';
import { ProductNotFoundError, ProductNotReadyForActiveError } from '../../domain/errors/catalog.errors';

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

const coverImage: ProductMediaItem = {
  id: 'media-1',
  productId: 'prod-1',
  type: PRODUCT_MEDIA_TYPE.IMAGE,
  url: 'https://example.com/cover.jpg',
  altText: 'Cover',
  sortOrder: 0,
  isCover: true,
};

describe('ChangeProductStatusUseCase', () => {
  let products: jest.Mocked<ProductRepository>;
  let variants: jest.Mocked<ProductVariantRepository>;
  let media: jest.Mocked<ProductMediaRepository>;
  let storeContext: StoreContext;
  let useCase: ChangeProductStatusUseCase;

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
    media = {
      replaceForProduct: jest.fn(),
      listByProduct: jest.fn(),
    };
    storeContext = {
      getCurrentStoreId: jest.fn().mockResolvedValue('store-1'),
    } as unknown as StoreContext;
    useCase = new ChangeProductStatusUseCase(products, variants, media, storeContext);
  });

  it('throws ProductNotFoundError when the product does not exist', async () => {
    products.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ productId: 'missing', status: PRODUCT_STATUS.ACTIVE }),
    ).rejects.toThrow(ProductNotFoundError);
  });

  it('moves a well-formed Draft product to Active when it has a variant and cover image', async () => {
    const product = buildProduct({ status: PRODUCT_STATUS.DRAFT });
    products.findById.mockResolvedValue(product);
    variants.countByProduct.mockResolvedValue(1);
    media.listByProduct.mockResolvedValue([coverImage]);

    const result = await useCase.execute({ productId: 'prod-1', status: PRODUCT_STATUS.ACTIVE });

    expect(result.status).toBe(PRODUCT_STATUS.ACTIVE);
    expect(products.save).toHaveBeenCalledWith(product);
  });

  it('blocks moving to Active when there is no variant', async () => {
    const product = buildProduct({ status: PRODUCT_STATUS.DRAFT });
    products.findById.mockResolvedValue(product);
    variants.countByProduct.mockResolvedValue(0);
    media.listByProduct.mockResolvedValue([coverImage]);

    await expect(
      useCase.execute({ productId: 'prod-1', status: PRODUCT_STATUS.ACTIVE }),
    ).rejects.toThrow(ProductNotReadyForActiveError);
    expect(products.save).not.toHaveBeenCalled();
  });

  it('blocks moving to Active when there is no cover image', async () => {
    const product = buildProduct({ status: PRODUCT_STATUS.DRAFT });
    products.findById.mockResolvedValue(product);
    variants.countByProduct.mockResolvedValue(1);
    media.listByProduct.mockResolvedValue([{ ...coverImage, isCover: false }]);

    await expect(
      useCase.execute({ productId: 'prod-1', status: PRODUCT_STATUS.ACTIVE }),
    ).rejects.toThrow(ProductNotReadyForActiveError);
    expect(products.save).not.toHaveBeenCalled();
  });

  it('allows moving to Archived without checking variants/media at all', async () => {
    const product = buildProduct({ status: PRODUCT_STATUS.ACTIVE });
    products.findById.mockResolvedValue(product);

    const result = await useCase.execute({ productId: 'prod-1', status: PRODUCT_STATUS.ARCHIVED });

    expect(result.status).toBe(PRODUCT_STATUS.ARCHIVED);
    expect(variants.countByProduct).not.toHaveBeenCalled();
    expect(media.listByProduct).not.toHaveBeenCalled();
  });

  it('allows moving Archived back to Draft', async () => {
    const product = buildProduct({ status: PRODUCT_STATUS.ARCHIVED });
    products.findById.mockResolvedValue(product);

    const result = await useCase.execute({ productId: 'prod-1', status: PRODUCT_STATUS.DRAFT });

    expect(result.status).toBe(PRODUCT_STATUS.DRAFT);
  });
});
