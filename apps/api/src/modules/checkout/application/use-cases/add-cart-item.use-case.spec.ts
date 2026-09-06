import { AddCartItemUseCase } from './add-cart-item.use-case';
import type { CartRepository } from '../../domain/repositories/cart.repository';
import type { ProductVariantRepository } from '../../../catalog/domain/repositories/product-variant.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Cart } from '../../domain/entities/cart.entity';
import { ProductVariant } from '../../../catalog/domain/entities/product-variant.entity';
import { InvalidCartQuantityError, ProductVariantNotFoundError } from '../../domain/errors/checkout.errors';

function buildCart(): Cart {
  return Cart.reconstitute({
    id: 'cart-1',
    storeId: 'store-1',
    guestToken: 'guest-token-abc',
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildVariant(): ProductVariant {
  return ProductVariant.reconstitute({
    id: 'variant-1',
    storeId: 'store-1',
    productId: 'prod-1',
    sku: 'SKU-1',
    barcode: null,
    colorId: null,
    sizeId: null,
    priceOverride: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('AddCartItemUseCase', () => {
  let carts: jest.Mocked<CartRepository>;
  let productVariants: jest.Mocked<ProductVariantRepository>;
  let storeContext: StoreContext;
  let useCase: AddCartItemUseCase;

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
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    useCase = new AddCartItemUseCase(carts, productVariants, storeContext);
  });

  it('adds an item to the cart, creating it if necessary', async () => {
    productVariants.findById.mockResolvedValue(buildVariant());
    carts.findOrCreateByToken.mockResolvedValue(buildCart());
    carts.addItem.mockResolvedValue(buildCart());

    await useCase.execute({ guestToken: 'guest-token-abc', variantId: 'variant-1', quantity: 2 });

    expect(carts.findOrCreateByToken).toHaveBeenCalledWith('store-1', 'guest-token-abc');
    expect(carts.addItem).toHaveBeenCalledWith('cart-1', 'variant-1', 2);
  });

  it('throws ProductVariantNotFoundError when the variant does not exist', async () => {
    productVariants.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ guestToken: 'guest-token-abc', variantId: 'missing', quantity: 1 }),
    ).rejects.toThrow(ProductVariantNotFoundError);
    expect(carts.addItem).not.toHaveBeenCalled();
  });

  it('rejects a non-positive quantity before touching the repository', async () => {
    await expect(
      useCase.execute({ guestToken: 'guest-token-abc', variantId: 'variant-1', quantity: 0 }),
    ).rejects.toThrow(InvalidCartQuantityError);
    expect(productVariants.findById).not.toHaveBeenCalled();
  });
});
