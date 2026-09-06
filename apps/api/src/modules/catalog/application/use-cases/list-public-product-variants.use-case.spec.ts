import { ListPublicProductVariantsUseCase } from './list-public-product-variants.use-case';
import type { ListProductVariantsUseCase } from './list-product-variants.use-case';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Product, type ProductProps } from '../../domain/entities/product.entity';
import { ProductVariant } from '../../domain/entities/product-variant.entity';
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

function buildVariant(): ProductVariant {
  return ProductVariant.reconstitute({
    id: 'variant-1',
    storeId: 'store-1',
    productId: 'prod-1',
    sku: 'SKU-1-A',
    barcode: null,
    colorId: null,
    sizeId: null,
    priceOverride: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ListPublicProductVariantsUseCase', () => {
  let products: jest.Mocked<ProductRepository>;
  let storeContext: StoreContext;
  let listProductVariants: jest.Mocked<ListProductVariantsUseCase>;
  let useCase: ListPublicProductVariantsUseCase;

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
    listProductVariants = { execute: jest.fn() } as unknown as jest.Mocked<ListProductVariantsUseCase>;
    useCase = new ListPublicProductVariantsUseCase(products, storeContext, listProductVariants);
  });

  it('delegates to ListProductVariantsUseCase when the product is ACTIVE', async () => {
    products.findById.mockResolvedValue(buildProduct());
    const variant = buildVariant();
    listProductVariants.execute.mockResolvedValue([variant]);

    const result = await useCase.execute({ productId: 'prod-1' });

    expect(result).toEqual([variant]);
    expect(listProductVariants.execute).toHaveBeenCalledWith({ productId: 'prod-1' });
  });

  it('throws ProductNotFoundError when the product does not exist', async () => {
    products.findById.mockResolvedValue(null);
    await expect(useCase.execute({ productId: 'missing' })).rejects.toThrow(ProductNotFoundError);
    expect(listProductVariants.execute).not.toHaveBeenCalled();
  });

  it('throws ProductNotFoundError when the product is not ACTIVE', async () => {
    products.findById.mockResolvedValue(buildProduct({ status: PRODUCT_STATUS.DRAFT }));
    await expect(useCase.execute({ productId: 'prod-1' })).rejects.toThrow(ProductNotFoundError);
    expect(listProductVariants.execute).not.toHaveBeenCalled();
  });
});
