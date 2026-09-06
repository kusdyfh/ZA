import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaShippingRateRepository } from './prisma-shipping-rate.repository';

describe('PrismaShippingRateRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaShippingRateRepository(prisma);
  let storeId: string;
  let zoneId: string;
  let methodId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Shipping Rate Integration Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;

    const zone = await prisma.shippingZone.create({
      data: { storeId, name: `Central-${randomUUID()}`, governorates: ['Baghdad'] },
    });
    zoneId = zone.id;

    const method = await prisma.shippingMethod.create({
      data: { storeId, name: `Standard-${randomUUID()}`, minDays: 3, maxDays: 5 },
    });
    methodId = method.id;
  });

  afterAll(async () => {
    await prisma.shippingRate.deleteMany({ where: { storeId } });
    await prisma.shippingZone.deleteMany({ where: { storeId } });
    await prisma.shippingMethod.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates a rate for a (zone, method) pair via upsert', async () => {
    const rate = await repository.upsert({ storeId, zoneId, methodId, fee: 5000, freeShippingThreshold: 50000 });

    expect(rate.zoneId).toBe(zoneId);
    expect(rate.methodId).toBe(methodId);
    expect(rate.fee).toBe(5000);
    expect(rate.freeShippingThreshold).toBe(50000);
  });

  it('upsert replaces the existing rate for the same (zone, method) pair rather than duplicating', async () => {
    await repository.upsert({ storeId, zoneId, methodId, fee: 5000, freeShippingThreshold: 50000 });
    const updated = await repository.upsert({ storeId, zoneId, methodId, fee: 7500, freeShippingThreshold: null });

    expect(updated.fee).toBe(7500);
    expect(updated.freeShippingThreshold).toBeNull();

    const all = await repository.list(storeId);
    expect(all.filter((r) => r.zoneId === zoneId && r.methodId === methodId)).toHaveLength(1);
  });

  it('finds the rate by zone and method', async () => {
    await repository.upsert({ storeId, zoneId, methodId, fee: 5000, freeShippingThreshold: 50000 });

    const found = await repository.findByZoneAndMethod(storeId, zoneId, methodId);
    expect(found?.fee).toBe(5000);
  });

  it('returns null when no rate exists for the (zone, method) pair', async () => {
    const otherMethod = await prisma.shippingMethod.create({
      data: { storeId, name: `Express-${randomUUID()}`, minDays: 1, maxDays: 2 },
    });

    expect(await repository.findByZoneAndMethod(storeId, zoneId, otherMethod.id)).toBeNull();
  });

  it('lists every rate for the store', async () => {
    const all = await repository.list(storeId);
    expect(all.map((r) => r.zoneId)).toContain(zoneId);
  });
});
