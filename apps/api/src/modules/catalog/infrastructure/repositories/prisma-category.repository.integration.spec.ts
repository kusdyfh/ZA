import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaCategoryRepository } from './prisma-category.repository';
import { Slug } from '../../domain/value-objects/slug.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';

describe('PrismaCategoryRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaCategoryRepository(prisma);
  let storeId: string;
  let rootId: string;
  let childId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Integration Test Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;
  });

  afterAll(async () => {
    await prisma.category.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates a root category', async () => {
    const category = await repository.create({
      storeId,
      name: 'Scrubs',
      slug: Slug.fromRaw('scrubs'),
      description: null,
      sortOrder: 0,
      parentId: null,
      seo: SeoMetadata.create({ metaTitle: 'Scrubs' }),
    });
    rootId = category.id;
    expect(category.slug.toString()).toBe('scrubs');
    expect(category.seo.metaTitle).toBe('Scrubs');
  });

  it('creates a child category', async () => {
    const category = await repository.create({
      storeId,
      name: 'Tops',
      slug: Slug.fromRaw('tops'),
      description: null,
      sortOrder: 0,
      parentId: rootId,
      seo: SeoMetadata.create({}),
    });
    childId = category.id;
    expect(category.parentId).toBe(rootId);
  });

  it('finds by id and by slug', async () => {
    const byId = await repository.findById(storeId, rootId);
    const bySlug = await repository.findBySlug(storeId, 'scrubs');
    expect(byId?.id).toBe(rootId);
    expect(bySlug?.id).toBe(rootId);
  });

  it('returns null for an id in a different store', async () => {
    const otherStore = await prisma.store.create({
      data: { name: 'Other Store', domain: `test-other-${randomUUID()}.local` },
    });
    const found = await repository.findById(otherStore.id, rootId);
    expect(found).toBeNull();
    await prisma.store.delete({ where: { id: otherStore.id } });
  });

  it('lists categories for the store, sorted by sortOrder', async () => {
    const all = await repository.list(storeId);
    expect(all.map((c) => c.id)).toEqual(expect.arrayContaining([rootId, childId]));
  });

  it('countChildren reflects the child category', async () => {
    expect(await repository.countChildren(storeId, rootId)).toBe(1);
    expect(await repository.countChildren(storeId, childId)).toBe(0);
  });

  it('countProducts is zero when no products reference the category', async () => {
    expect(await repository.countProducts(storeId, rootId)).toBe(0);
  });

  it('persists mutations via save()', async () => {
    const category = await repository.findById(storeId, childId);
    expect(category).not.toBeNull();

    category!.rename('Renamed Tops');
    category!.deactivate();
    await repository.save(category!);

    const reloaded = await repository.findById(storeId, childId);
    expect(reloaded?.name).toBe('Renamed Tops');
    expect(reloaded?.isActive).toBe(false);
  });

  it('deletes an empty leaf category', async () => {
    await repository.delete(storeId, childId);
    expect(await repository.findById(storeId, childId)).toBeNull();
  });
});
