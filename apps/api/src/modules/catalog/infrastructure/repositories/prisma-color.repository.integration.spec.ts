import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaColorRepository } from './prisma-color.repository';

describe('PrismaColorRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaColorRepository(prisma);
  let storeId: string;
  let colorId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Integration Test Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;
  });

  afterAll(async () => {
    await prisma.color.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates a color', async () => {
    const color = await repository.create({ storeId, name: 'Navy Blue', hexCode: '#1B2A4A' });
    colorId = color.id;
    expect(color.hexCode).toBe('#1B2A4A');
  });

  it('finds by id and by name', async () => {
    expect((await repository.findById(storeId, colorId))?.id).toBe(colorId);
    expect((await repository.findByName(storeId, 'Navy Blue'))?.id).toBe(colorId);
  });

  it('lists colors for the store', async () => {
    const all = await repository.list(storeId);
    expect(all.map((c) => c.id)).toContain(colorId);
  });

  it('persists mutations via save()', async () => {
    const color = await repository.findById(storeId, colorId);
    color!.rename('Deep Navy');
    color!.changeHexCode('#0F1B33');
    await repository.save(color!);

    const reloaded = await repository.findById(storeId, colorId);
    expect(reloaded?.name).toBe('Deep Navy');
    expect(reloaded?.hexCode).toBe('#0F1B33');
  });

  it('deletes a color', async () => {
    await repository.delete(storeId, colorId);
    expect(await repository.findById(storeId, colorId)).toBeNull();
  });
});
