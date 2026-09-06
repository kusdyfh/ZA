import { AddWishlistItemUseCase } from './add-wishlist-item.use-case';
import type { WishlistItemRepository } from '../../domain/repositories/wishlist-item.repository';
import type { ProductRepository } from '../../../catalog/domain/repositories/product.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { WishlistItem } from '../../domain/entities/wishlist-item.entity';
import { ProductNotFoundError } from '../../../catalog/domain/errors/catalog.errors';
import { WishlistItemAlreadyExistsError } from '../../domain/errors/customer.errors';
import type { Product } from '../../../catalog/domain/entities/product.entity';

describe('AddWishlistItemUseCase', () => {
  let wishlistItems: jest.Mocked<WishlistItemRepository>;
  let products: jest.Mocked<ProductRepository>;
  let storeContext: StoreContext;
  let useCase: AddWishlistItemUseCase;

  const input = { customerId: 'customer-1', productId: 'product-1' };

  beforeEach(() => {
    wishlistItems = {
      create: jest.fn(),
      findByCustomerAndProduct: jest.fn(),
      delete: jest.fn(),
      listByCustomerId: jest.fn(),
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
    useCase = new AddWishlistItemUseCase(wishlistItems, products, storeContext);
  });

  it('adds a product to the wishlist', async () => {
    products.findById.mockResolvedValue({} as Product);
    wishlistItems.findByCustomerAndProduct.mockResolvedValue(null);
    wishlistItems.create.mockResolvedValue(
      WishlistItem.reconstitute({ id: 'w-1', customerId: 'customer-1', productId: 'product-1', createdAt: new Date() }),
    );

    const result = await useCase.execute(input);

    expect(result.productId).toBe('product-1');
    expect(wishlistItems.create).toHaveBeenCalledWith('customer-1', 'product-1');
  });

  it('throws ProductNotFoundError for an unknown product', async () => {
    products.findById.mockResolvedValue(null);
    await expect(useCase.execute(input)).rejects.toThrow(ProductNotFoundError);
  });

  it('throws WishlistItemAlreadyExistsError for a duplicate', async () => {
    products.findById.mockResolvedValue({} as Product);
    wishlistItems.findByCustomerAndProduct.mockResolvedValue(
      WishlistItem.reconstitute({ id: 'w-1', customerId: 'customer-1', productId: 'product-1', createdAt: new Date() }),
    );

    await expect(useCase.execute(input)).rejects.toThrow(WishlistItemAlreadyExistsError);
    expect(wishlistItems.create).not.toHaveBeenCalled();
  });
});
