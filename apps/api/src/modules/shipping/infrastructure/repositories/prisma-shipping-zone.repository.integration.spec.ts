import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaShippingZoneRepository } from './prisma-shipping-zone.repository';
import { ShippingZoneNotFoundError } from '../../domain/errors/shipping.errors';

describe('PrismaShippingZoneRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaShippingZoneRepository(prisma);
  let storeId: string;
  let zoneId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Shipping Zone Integration Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;
  });

  afterAll(async () => {
    await prisma.shippingZone.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates a zone', async () => {
    const zone = await repository.create({ storeId, name: 'Central Iraq', governorates: ['Baghdad', 'Babil'] });
    zoneId = zone.id;

    expect(zone.name).toBe('Central Iraq');
    expect(zone.governorates).toEqual(['Baghdad', 'Babil']);
    expect(zone.isActive).toBe(true);
  });

  it('finds by id, scoped to the store', async () => {
    expect((await repository.findById(storeId, zoneId))?.id).toBe(zoneId);
    expect(await repository.findById('some-other-store', zoneId)).toBeNull();
  });

  it('finds the active zone covering a governorate', async () => {
    const found = await repository.findByGovernorate(storeId, 'Baghdad');
    expect(found?.id).toBe(zoneId);
    expect(await repository.findByGovernorate(storeId, 'Erbil')).toBeNull();
  });

  it('lists every zone for the store', async () => {
    const all = await repository.list(storeId);
    expect(all.map((z) => z.id)).toContain(zoneId);
  });

  it('updates fields selectively, leaving the rest untouched', async () => {
    const updated = await repository.update(storeId, zoneId, { name: 'Central Iraq (Renamed)' });
    expect(updated.name).toBe('Central Iraq (Renamed)');
    expect(updated.governorates).toEqual(['Baghdad', 'Babil']);
  });

  it('updates the governorates list', async () => {
    const updated = await repository.update(storeId, zoneId, { governorates: ['Baghdad'] });
    expect(updated.governorates).toEqual(['Baghdad']);
  });

  it('deactivating a zone means it no longer matches any governorate lookup', async () => {
    await repository.update(storeId, zoneId, { isActive: false });
    expect(await repository.findByGovernorate(storeId, 'Baghdad')).toBeNull();

    const reactivated = await repository.update(storeId, zoneId, { isActive: true });
    expect(reactivated.isActive).toBe(true);
  });

  it('throws ShippingZoneNotFoundError when updating an unknown zone', async () => {
    await expect(
      repository.update(storeId, 'missing-zone', { name: 'Nope' }),
    ).rejects.toThrow(ShippingZoneNotFoundError);
  });

  it('throws ShippingZoneNotFoundError when updating a zone belonging to another store', async () => {
    await expect(
      repository.update('some-other-store', zoneId, { name: 'Nope' }),
    ).rejects.toThrow(ShippingZoneNotFoundError);
  });
});
