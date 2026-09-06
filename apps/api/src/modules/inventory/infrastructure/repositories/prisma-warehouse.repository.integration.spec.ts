import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaWarehouseRepository } from './prisma-warehouse.repository';

describe('PrismaWarehouseRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaWarehouseRepository(prisma);
  let storeId: string;
  let warehouseId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Inventory Integration Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;
  });

  afterAll(async () => {
    await prisma.warehouse.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates a warehouse', async () => {
    const warehouse = await repository.create({
      storeId,
      name: 'Main Warehouse',
      code: 'MAIN',
      isDefault: true,
    });
    warehouseId = warehouse.id;

    expect(warehouse.code).toBe('MAIN');
    expect(warehouse.isDefault).toBe(true);
  });

  it('finds by id and by code', async () => {
    expect((await repository.findById(storeId, warehouseId))?.id).toBe(warehouseId);
    expect((await repository.findByCode(storeId, 'MAIN'))?.id).toBe(warehouseId);
  });

  it('finds the default warehouse for the store', async () => {
    expect((await repository.findDefault(storeId))?.id).toBe(warehouseId);
  });

  it('lists every warehouse for the store', async () => {
    const all = await repository.list(storeId);
    expect(all.map((w) => w.id)).toContain(warehouseId);
  });

  it('persists mutations via save()', async () => {
    const warehouse = await repository.findById(storeId, warehouseId);
    warehouse!.rename('Renamed Warehouse');
    warehouse!.changeCode('SECONDARY');
    await repository.save(warehouse!);

    const reloaded = await repository.findById(storeId, warehouseId);
    expect(reloaded?.name).toBe('Renamed Warehouse');
    expect(reloaded?.code).toBe('SECONDARY');
  });

  it('does not find a warehouse belonging to another store', async () => {
    expect(await repository.findById('some-other-store', warehouseId)).toBeNull();
  });
});
