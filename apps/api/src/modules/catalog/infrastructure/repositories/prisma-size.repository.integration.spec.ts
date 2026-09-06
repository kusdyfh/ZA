import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaSizeRepository } from './prisma-size.repository';

describe('PrismaSizeRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaSizeRepository(prisma);
  let storeId: string;
  let sizeId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Integration Test Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;
  });

  afterAll(async () => {
    await prisma.size.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates a size', async () => {
    const size = await repository.create({ storeId, label: 'M', sortOrder: 2 });
    sizeId = size.id;
    expect(size.label).toBe('M');
  });

  it('finds by id and by label', async () => {
    expect((await repository.findById(storeId, sizeId))?.id).toBe(sizeId);
    expect((await repository.findByLabel(storeId, 'M'))?.id).toBe(sizeId);
  });

  it('lists sizes for the store, sorted by sortOrder', async () => {
    const all = await repository.list(storeId);
    expect(all.map((s) => s.id)).toContain(sizeId);
  });

  it('persists mutations via save()', async () => {
    const size = await repository.findById(storeId, sizeId);
    size!.relabel('L');
    size!.reorder(3);
    await repository.save(size!);

    const reloaded = await repository.findById(storeId, sizeId);
    expect(reloaded?.label).toBe('L');
    expect(reloaded?.sortOrder).toBe(3);
  });

  it('deletes a size', async () => {
    await repository.delete(storeId, sizeId);
    expect(await repository.findById(storeId, sizeId)).toBeNull();
  });
});
