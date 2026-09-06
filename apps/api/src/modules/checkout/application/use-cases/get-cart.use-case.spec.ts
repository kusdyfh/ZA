import { GetCartUseCase } from './get-cart.use-case';
import type { CartRepository } from '../../domain/repositories/cart.repository';
import type { ProductVariantRepository } from '../../../catalog/domain/repositories/product-variant.repository';
import type { ProductRepository } from '../../../catalog/domain/repositories/product.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Cart } from '../../domain/entities/cart.entity';
import { ProductVariant } from '../../../catalog/domain/entities/product-variant.entity';
import { Product } from '../../../catalog/domain/entities/product.entity';
import { Slug } from '../../../catalog/domain/value-objects/slug.vo';
import { Money } from '../../../catalog/domain/value-objects/money.vo';
import { SeoMetadata } from '../../../catalog/domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../../catalog/domain/constants/product-status.constants';

function buildCart(): Cart {
  return Cart.reconstitute({
    id: 'cart-1',
    storeId: 'store-1',
    guestToken: 'guest-token-abc',
    items: [
      {
        id: 'item-1',
        cartId: 'cart-1',
        variantId: 'variant-1',
        quantity: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildVariant(priceOverride: Money | null = null): ProductVariant {
  return ProductVariant.reconstitute({
    id: 'variant-1',
    storeId: 'store-1',
    productId: 'prod-1',
    sku: 'ZA-TOP-VNECK-001-NVY-M',
    barcode: null,
    colorId: null,
    sizeId: null,
    priceOverride,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildProduct(discountPrice: Money | null = null): Product {
  return Product.reconstitute({
    id: 'prod-1',
    storeId: 'store-1',
    name: 'Classic V-Neck Scrub Top',
    slug: Slug.fromRaw('classic-v-neck-scrub-top'),
    sku: 'ZA-TOP-001',
    shortDescription: null,
    description: null,
    status: PRODUCT_STATUS.ACTIVE,
    price: Money.create(39000, 'IQD'),
    discountPrice,
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
  });
}

describe('GetCartUseCase', () => {
  let carts: jest.Mocked<CartRepository>;
  let productVariants: jest.Mocked<ProductVariantRepository>;
  let products: jest.Mocked<ProductRepository>;
  let storeContext: StoreContext;
  let useCase: GetCartUseCase;

  beforeEach(() => {
    carts = {
      findOrCreateByToken: jest.fn(),
      findByToken: jest.fn(),
      addItem: jest.fn(),
      setItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    productVariants = {
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
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    useCase = new GetCartUseCase(carts, productVariants, products, storeContext);
  });

  it('resolves live pricing and totals for each cart item', async () => {
    carts.findOrCreateByToken.mockResolvedValue(buildCart());
    productVariants.findById.mockResolvedValue(buildVariant());
    products.findById.mockResolvedValue(buildProduct());

    const result = await useCase.execute({ guestToken: 'guest-token-abc' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        productName: 'Classic V-Neck Scrub Top',
        unitPrice: 39000,
        quantity: 2,
        lineTotal: 78000,
      }),
    );
    expect(result.subtotal).toBe(78000);
    expect(result.currencyCode).toBe('IQD');
  });

  it('prefers the variant price override over the product price', async () => {
    carts.findOrCreateByToken.mockResolvedValue(buildCart());
    productVariants.findById.mockResolvedValue(buildVariant(Money.create(35000, 'IQD')));
    products.findById.mockResolvedValue(buildProduct());

    const result = await useCase.execute({ guestToken: 'guest-token-abc' });

    expect(result.items[0]!.unitPrice).toBe(35000);
  });

  it('prefers the product discount price over the base price when no override exists', async () => {
    carts.findOrCreateByToken.mockResolvedValue(buildCart());
    productVariants.findById.mockResolvedValue(buildVariant());
    products.findById.mockResolvedValue(buildProduct(Money.create(30000, 'IQD')));

    const result = await useCase.execute({ guestToken: 'guest-token-abc' });

    expect(result.items[0]!.unitPrice).toBe(30000);
  });

  it('skips a cart item whose variant no longer resolves', async () => {
    carts.findOrCreateByToken.mockResolvedValue(buildCart());
    productVariants.findById.mockResolvedValue(null);

    const result = await useCase.execute({ guestToken: 'guest-token-abc' });

    expect(result.items).toEqual([]);
    expect(result.subtotal).toBe(0);
  });
});
