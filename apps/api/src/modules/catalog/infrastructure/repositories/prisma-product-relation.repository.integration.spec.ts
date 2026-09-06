import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaProductRelationRepository } from './prisma-product-relation.repository';

describe('PrismaProductRelationRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaProductRelationRepository(prisma);
  let storeId: string;
  let productAId: string;
  let productBId: string;
  let productCId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Integration Test Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;

    const category = await prisma.category.create({
      data: { storeId, name: 'Scrubs', slug: 'scrubs' },
    });

    const [productA, productB, productC] = await Promise.all([
      prisma.product.create({
        data: { storeId, name: 'A', slug: 'product-a', sku: 'SKU-A', price: '100.00', categoryId: category.id },
      }),
      prisma.product.create({
        data: { storeId, name: 'B', slug: 'product-b', sku: 'SKU-B', price: '100.00', categoryId: category.id },
      }),
      prisma.product.create({
        data: { storeId, name: 'C', slug: 'product-c', sku: 'SKU-C', price: '100.00', categoryId: category.id },
      }),
    ]);
    productAId = productA.id;
    productBId = productB.id;
    productCId = productC.id;
  });

  afterAll(async () => {
    await prisma.productRelation.deleteMany({ where: { productId: { in: [productAId, productBId, productCId] } } });
    await prisma.product.deleteMany({ where: { storeId } });
    await prisma.category.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('replaces relations of one type and preserves order', async () => {
    await repository.replace(productAId, 'CROSS_SELL', [productBId, productCId]);

    const related = await repository.listRelatedProducts(productAId, 'CROSS_SELL');
    expect(related.map((p) => p.id)).toEqual([productBId, productCId]);
  });

  it('does not affect a different relation type on the same product', async () => {
    await repository.replace(productAId, 'RELATED', [productCId]);

    const crossSell = await repository.listRelatedProducts(productAId, 'CROSS_SELL');
    const related = await repository.listRelatedProducts(productAId, 'RELATED');
    expect(crossSell.map((p) => p.id)).toEqual([productBId, productCId]);
    expect(related.map((p) => p.id)).toEqual([productCId]);
  });

  it('fully replaces relations of a type on a second call (not additive)', async () => {
    await repository.replace(productAId, 'CROSS_SELL', [productCId]);

    const crossSell = await repository.listRelatedProducts(productAId, 'CROSS_SELL');
    expect(crossSell.map((p) => p.id)).toEqual([productCId]);
  });
});
