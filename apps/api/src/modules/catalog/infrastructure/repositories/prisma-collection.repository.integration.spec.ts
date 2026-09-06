import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaCollectionRepository } from './prisma-collection.repository';
import { Slug } from '../../domain/value-objects/slug.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';

describe('PrismaCollectionRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaCollectionRepository(prisma);
  let storeId: string;
  let categoryId: string;
  let collectionId: string;
  let productAId: string;
  let productBId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Integration Test Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;

    const category = await prisma.category.create({
      data: { storeId, name: 'Scrubs', slug: 'scrubs' },
    });
    categoryId = category.id;

    const productA = await prisma.product.create({
      data: {
        storeId,
        name: 'Product A',
        slug: 'product-a',
        sku: 'SKU-A',
        price: '100.00',
        categoryId,
      },
    });
    const productB = await prisma.product.create({
      data: {
        storeId,
        name: 'Product B',
        slug: 'product-b',
        sku: 'SKU-B',
        price: '200.00',
        categoryId,
      },
    });
    productAId = productA.id;
    productBId = productB.id;
  });

  afterAll(async () => {
    await prisma.collectionProduct.deleteMany({ where: { collection: { storeId } } });
    await prisma.collection.deleteMany({ where: { storeId } });
    await prisma.product.deleteMany({ where: { storeId } });
    await prisma.category.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates a collection', async () => {
    const collection = await repository.create({
      storeId,
      name: 'New Arrivals',
      slug: Slug.fromRaw('new-arrivals'),
      description: null,
      startsAt: null,
      endsAt: null,
      seo: SeoMetadata.create({ metaTitle: 'New Arrivals' }),
    });
    collectionId = collection.id;
    expect(collection.isCurrentlyLive()).toBe(true);
  });

  it('finds by id and by slug', async () => {
    expect((await repository.findById(storeId, collectionId))?.id).toBe(collectionId);
    expect((await repository.findBySlug(storeId, 'new-arrivals'))?.id).toBe(collectionId);
  });

  it('replaces product membership and order', async () => {
    await repository.replaceProducts(storeId, collectionId, [productBId, productAId]);

    const entries = await repository.listProducts(storeId, collectionId);
    expect(entries.map((e) => e.product.id)).toEqual([productBId, productAId]);
    expect(entries.map((e) => e.sortOrder)).toEqual([0, 1]);
  });

  it('fully replaces membership on a second call (not additive)', async () => {
    await repository.replaceProducts(storeId, collectionId, [productAId]);

    const entries = await repository.listProducts(storeId, collectionId);
    expect(entries.map((e) => e.product.id)).toEqual([productAId]);
  });

  it('persists mutations via save()', async () => {
    const collection = await repository.findById(storeId, collectionId);
    collection!.deactivate();
    await repository.save(collection!);

    const reloaded = await repository.findById(storeId, collectionId);
    expect(reloaded?.isActive).toBe(false);
    expect(reloaded?.isCurrentlyLive()).toBe(false);
  });

  it('deletes a collection', async () => {
    await repository.delete(storeId, collectionId);
    expect(await repository.findById(storeId, collectionId)).toBeNull();
  });
});
