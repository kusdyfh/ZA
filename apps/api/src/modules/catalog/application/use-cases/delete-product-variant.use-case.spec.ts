import { DeleteProductVariantUseCase } from './delete-product-variant.use-case';
import type { ProductVariantRepository } from '../../domain/repositories/product-variant.repository';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Product, type ProductProps } from '../../domain/entities/product.entity';
import { ProductVariant, type ProductVariantProps } from '../../domain/entities/product-variant.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import { LastVariantOfActiveProductError, ProductVariantNotFoundError } from '../../domain/errors/catalog.errors';

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

function buildVariant(overrides: Partial<ProductVariantProps> = {}): ProductVariant {
  return ProductVariant.reconstitute({
    id: 'variant-1',
    storeId: 'store-1',
    productId: 'prod-1',
    sku: 'SKU-A',
    barcode: null,
    colorId: null,
    sizeId: null,
    priceOverride: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('DeleteProductVariantUseCase', () => {
  let variants: jest.Mocked<ProductVariantRepository>;
  let products: jest.Mocked<ProductRepository>;
  let storeContext: StoreContext;
  let useCase: DeleteProductVariantUseCase;

  beforeEach(() => {
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
    useCase = new DeleteProductVariantUseCase(variants, products, storeContext);
  });

  it('throws ProductVariantNotFoundError when the variant does not exist', async () => {
    variants.findById.mockResolvedValue(null);
    await expect(useCase.execute({ variantId: 'missing' })).rejects.toThrow(
      ProductVariantNotFoundError,
    );
  });

  it('blocks removing the last variant of an Active product', async () => {
    variants.findById.mockResolvedValue(buildVariant());
    products.findById.mockResolvedValue(buildProduct({ status: PRODUCT_STATUS.ACTIVE }));
    variants.countByProduct.mockResolvedValue(1);

    await expect(useCase.execute({ variantId: 'variant-1' })).rejects.toThrow(
      LastVariantOfActiveProductError,
    );
    expect(variants.delete).not.toHaveBeenCalled();
  });

  it('allows removing a variant when the Active product has others remaining', async () => {
    variants.findById.mockResolvedValue(buildVariant());
    products.findById.mockResolvedValue(buildProduct({ status: PRODUCT_STATUS.ACTIVE }));
    variants.countByProduct.mockResolvedValue(2);

    await useCase.execute({ variantId: 'variant-1' });

    expect(variants.delete).toHaveBeenCalledWith('store-1', 'variant-1');
  });

  it('allows removing the last variant of a Draft product', async () => {
    variants.findById.mockResolvedValue(buildVariant());
    products.findById.mockResolvedValue(buildProduct({ status: PRODUCT_STATUS.DRAFT }));
    variants.countByProduct.mockResolvedValue(1);

    await useCase.execute({ variantId: 'variant-1' });

    expect(variants.delete).toHaveBeenCalledWith('store-1', 'variant-1');
  });
});
