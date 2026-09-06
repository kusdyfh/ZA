import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaCartRepository } from './prisma-cart.repository';
import { CartItemNotFoundError } from '../../domain/errors/checkout.errors';

describe('PrismaCartRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaCartRepository(prisma);
  let storeId: string;
  let variantId: string;
  let variantId2: string;
  let cartId: string;
  const guestToken = `guest-${randomUUID()}`;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Cart Integration Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;

    const category = await prisma.category.create({
      data: { storeId, name: 'Scrubs', slug: `scrubs-${randomUUID()}` },
    });
    const product = await prisma.product.create({
      data: {
        storeId,
        name: 'Test Product',
        slug: `test-product-${randomUUID()}`,
        sku: `TEST-SKU-${randomUUID()}`,
        price: '100.00',
        currencyCode: 'IQD',
        categoryId: category.id,
      },
    });
    const variant = await prisma.productVariant.create({
      data: { storeId, productId: product.id, sku: `TEST-VARIANT-${randomUUID()}` },
    });
    variantId = variant.id;
    const variant2 = await prisma.productVariant.create({
      data: { storeId, productId: product.id, sku: `TEST-VARIANT-2-${randomUUID()}` },
    });
    variantId2 = variant2.id;
  });

  afterAll(async () => {
    await prisma.cartItem.deleteMany({ where: { cart: { storeId } } });
    await prisma.cart.deleteMany({ where: { storeId } });
    await prisma.productVariant.deleteMany({ where: { storeId } });
    await prisma.product.deleteMany({ where: { storeId } });
    await prisma.category.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates a cart on first access', async () => {
    const cart = await repository.findOrCreateByToken(storeId, guestToken);
    cartId = cart.id;
    expect(cart.guestToken).toBe(guestToken);
    expect(cart.items).toEqual([]);
  });

  it('returns the same cart on a second access (upsert, not a new row)', async () => {
    const cart = await repository.findOrCreateByToken(storeId, guestToken);
    expect(cart.id).toBe(cartId);
  });

  it('adds an item, then increments quantity when the same variant is added again', async () => {
    await repository.addItem(cartId, variantId, 2);
    const cart = await repository.addItem(cartId, variantId, 3);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]!.quantity).toBe(5);
  });

  it('sets an absolute quantity for an existing item', async () => {
    const cart = await repository.setItemQuantity(cartId, variantId, 10);
    expect(cart.items[0]!.quantity).toBe(10);
  });

  it('throws CartItemNotFoundError when setting quantity for an item not in the cart', async () => {
    await expect(repository.setItemQuantity(cartId, variantId2, 1)).rejects.toThrow(
      CartItemNotFoundError,
    );
  });

  it('removes an item (idempotently)', async () => {
    await repository.addItem(cartId, variantId2, 1);
    const cart = await repository.removeItem(cartId, variantId2);
    expect(cart.items.map((i) => i.variantId)).not.toContain(variantId2);

    const secondRemove = await repository.removeItem(cartId, variantId2);
    expect(secondRemove.items).toHaveLength(1);
  });

  it('clears every item from the cart', async () => {
    await repository.clear(cartId);
    const cart = await repository.findByToken(storeId, guestToken);
    expect(cart?.items).toEqual([]);
  });

  it('findByToken returns null for an unknown token', async () => {
    expect(await repository.findByToken(storeId, `unknown-${randomUUID()}`)).toBeNull();
  });
});
