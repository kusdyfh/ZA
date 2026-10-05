import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaProductMediaRepository } from './prisma-product-media.repository';

describe('PrismaProductMediaRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaProductMediaRepository(prisma);
  let storeId: string;
  let productId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: {
        name: 'Integration Test Store',
        domain: `test-${randomUUID()}.local`,
      },
    });
    storeId = store.id;

    const category = await prisma.category.create({
      data: { storeId, name: 'Scrubs', slug: 'scrubs' },
    });

    const product = await prisma.product.create({
      data: {
        storeId,
        name: 'Test Product',
        slug: 'test-product',
        sku: 'TEST-SKU',
        price: '100.00',
        categoryId: category.id,
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.productMedia.deleteMany({ where: { productId } });
    await prisma.product.deleteMany({ where: { storeId } });
    await prisma.category.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('replaces the media set and assigns sortOrder by array position', async () => {
    await repository.replaceForProduct(productId, [
      {
        type: 'IMAGE',
        url: 'https://example.com/cover.jpg',
        altText: 'Cover',
        isCover: true,
        colorId: null,
      },
      {
        type: 'IMAGE',
        url: 'https://example.com/back.jpg',
        altText: 'Back',
        isCover: false,
        colorId: null,
      },
      {
        type: 'VIDEO',
        url: 'https://example.com/demo.mp4',
        altText: null,
        isCover: false,
        colorId: null,
      },
    ]);

    const items = await repository.listByProduct(productId);
    expect(items.map((i) => i.url)).toEqual([
      'https://example.com/cover.jpg',
      'https://example.com/back.jpg',
      'https://example.com/demo.mp4',
    ]);
    expect(items[0]?.isCover).toBe(true);
    expect(items[2]?.type).toBe('VIDEO');
    expect(items[2]?.altText).toBeNull();
  });

  it('fully replaces the set on a second call (not additive)', async () => {
    await repository.replaceForProduct(productId, [
      {
        type: 'IMAGE',
        url: 'https://example.com/only.jpg',
        altText: 'Only image',
        isCover: true,
        colorId: null,
      },
    ]);

    const items = await repository.listByProduct(productId);
    expect(items).toHaveLength(1);
    expect(items[0]?.url).toBe('https://example.com/only.jpg');
  });
});
