import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaBrandRepository } from './prisma-brand.repository';
import { Slug } from '../../domain/value-objects/slug.vo';

describe('PrismaBrandRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaBrandRepository(prisma);
  let storeId: string;
  let brandId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Integration Test Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;
  });

  afterAll(async () => {
    await prisma.brand.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates a brand', async () => {
    const brand = await repository.create({
      storeId,
      name: 'ZA Originals',
      slug: Slug.fromRaw('za-originals'),
      description: null,
    });
    brandId = brand.id;
    expect(brand.name).toBe('ZA Originals');
  });

  it('finds by id and by slug', async () => {
    expect((await repository.findById(storeId, brandId))?.id).toBe(brandId);
    expect((await repository.findBySlug(storeId, 'za-originals'))?.id).toBe(brandId);
  });

  it('lists brands for the store', async () => {
    const all = await repository.list(storeId);
    expect(all.map((b) => b.id)).toContain(brandId);
  });

  it('persists mutations via save()', async () => {
    const brand = await repository.findById(storeId, brandId);
    brand!.rename('Renamed Brand');
    await repository.save(brand!);

    const reloaded = await repository.findById(storeId, brandId);
    expect(reloaded?.name).toBe('Renamed Brand');
  });

  it('deletes a brand', async () => {
    await repository.delete(storeId, brandId);
    expect(await repository.findById(storeId, brandId)).toBeNull();
  });
});
