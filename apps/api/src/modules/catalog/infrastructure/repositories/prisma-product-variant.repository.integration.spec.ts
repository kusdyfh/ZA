import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaProductVariantRepository } from './prisma-product-variant.repository';
import { Money } from '../../domain/value-objects/money.vo';

describe('PrismaProductVariantRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaProductVariantRepository(prisma);
  let storeId: string;
  let categoryId: string;
  let productId: string;
  let variantId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Integration Test Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;

    const category = await prisma.category.create({
      data: { storeId, name: 'Scrubs', slug: 'scrubs' },
    });
    categoryId = category.id;

    const product = await prisma.product.create({
      data: {
        storeId,
        name: 'Test Product',
        slug: 'test-product',
        sku: 'TEST-SKU',
        price: '100.00',
        currencyCode: 'IQD',
        categoryId,
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.productVariant.deleteMany({ where: { storeId } });
    await prisma.product.deleteMany({ where: { storeId } });
    await prisma.category.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates a variant and resolves its price-override currency from the owning product', async () => {
    const variant = await repository.create({
      storeId,
      productId,
      sku: 'TEST-SKU-NVY-M',
      barcode: '9781234567897',
      colorId: null,
      sizeId: null,
      priceOverride: Money.create(120, 'IQD'),
    });
    variantId = variant.id;

    expect(variant.priceOverride?.toDecimalString()).toBe('120.00');
    expect(variant.priceOverride?.currency).toBe('IQD');
  });

  it('finds by id, sku, and barcode', async () => {
    expect((await repository.findById(storeId, variantId))?.id).toBe(variantId);
    expect((await repository.findBySku(storeId, 'TEST-SKU-NVY-M'))?.id).toBe(variantId);
    expect((await repository.findByBarcode(storeId, '9781234567897'))?.id).toBe(variantId);
  });

  it('lists variants for the product and counts them', async () => {
    const all = await repository.listByProduct(storeId, productId);
    expect(all.map((v) => v.id)).toContain(variantId);
    expect(await repository.countByProduct(storeId, productId)).toBe(1);
  });

  it('persists mutations via save(), including clearing the price override', async () => {
    const variant = await repository.findById(storeId, variantId);
    variant!.changeSku('TEST-SKU-NVY-L');
    variant!.changePriceOverride(null);
    await repository.save(variant!);

    const reloaded = await repository.findById(storeId, variantId);
    expect(reloaded?.sku).toBe('TEST-SKU-NVY-L');
    expect(reloaded?.priceOverride).toBeNull();
  });

  it('deletes a variant', async () => {
    await repository.delete(storeId, variantId);
    expect(await repository.findById(storeId, variantId)).toBeNull();
    expect(await repository.countByProduct(storeId, productId)).toBe(0);
  });
});
