import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaTagRepository } from './prisma-tag.repository';
import { Slug } from '../../domain/value-objects/slug.vo';

describe('PrismaTagRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaTagRepository(prisma);
  let storeId: string;
  let tagId: string;
  let secondTagId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Integration Test Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;
  });

  afterAll(async () => {
    await prisma.tag.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates tags', async () => {
    const tag = await repository.create({ storeId, name: 'New', slug: Slug.fromRaw('new') });
    tagId = tag.id;
    const second = await repository.create({
      storeId,
      name: 'Bestseller',
      slug: Slug.fromRaw('bestseller'),
    });
    secondTagId = second.id;
    expect(tag.name).toBe('New');
  });

  it('finds by id and by slug', async () => {
    expect((await repository.findById(storeId, tagId))?.id).toBe(tagId);
    expect((await repository.findBySlug(storeId, 'new'))?.id).toBe(tagId);
  });

  it('findManyByIds returns only the matching tags', async () => {
    const found = await repository.findManyByIds(storeId, [tagId, secondTagId, 'missing-id']);
    expect(found.map((t) => t.id).sort()).toEqual([secondTagId, tagId].sort());
  });

  it('lists tags for the store', async () => {
    const all = await repository.list(storeId);
    expect(all.map((t) => t.id)).toEqual(expect.arrayContaining([tagId, secondTagId]));
  });

  it('persists mutations via save()', async () => {
    const tag = await repository.findById(storeId, tagId);
    tag!.rename('Renamed Tag');
    await repository.save(tag!);

    expect((await repository.findById(storeId, tagId))?.name).toBe('Renamed Tag');
  });

  it('deletes a tag', async () => {
    await repository.delete(storeId, tagId);
    expect(await repository.findById(storeId, tagId)).toBeNull();
  });
});
