import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaProductSpecificationRepository } from './prisma-product-specification.repository';

describe('PrismaProductSpecificationRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaProductSpecificationRepository(prisma);
  let storeId: string;
  let productId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Integration Test Store', domain: `test-${randomUUID()}.local` },
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
    await prisma.productSpecification.deleteMany({ where: { productId } });
    await prisma.product.deleteMany({ where: { storeId } });
    await prisma.category.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('replaces the specification sheet and assigns sortOrder by array position', async () => {
    await repository.replaceForProduct(productId, [
      { label: 'Material', value: '65% Polyester, 35% Cotton' },
      { label: 'Care', value: 'Machine wash cold.' },
    ]);

    const items = await repository.listByProduct(productId);
    expect(items.map((i) => i.label)).toEqual(['Material', 'Care']);
    expect(items[0]?.value).toBe('65% Polyester, 35% Cotton');
  });

  it('fully replaces the sheet on a second call (not additive)', async () => {
    await repository.replaceForProduct(productId, [{ label: 'Fit', value: 'Relaxed' }]);

    const items = await repository.listByProduct(productId);
    expect(items).toHaveLength(1);
    expect(items[0]?.label).toBe('Fit');
  });
});
