import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaShippingMethodRepository } from './prisma-shipping-method.repository';
import { ShippingMethodNotFoundError } from '../../domain/errors/shipping.errors';

describe('PrismaShippingMethodRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaShippingMethodRepository(prisma);
  let storeId: string;
  let methodId: string;

  beforeAll(async () => {
    const store = await prisma.store.create({
      data: { name: 'Shipping Method Integration Store', domain: `test-${randomUUID()}.local` },
    });
    storeId = store.id;
  });

  afterAll(async () => {
    await prisma.shippingMethod.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { id: storeId } });
    await prisma.$disconnect();
  });

  it('creates a method', async () => {
    const method = await repository.create({ storeId, name: 'Standard Delivery', minDays: 3, maxDays: 5 });
    methodId = method.id;

    expect(method.name).toBe('Standard Delivery');
    expect(method.minDays).toBe(3);
    expect(method.maxDays).toBe(5);
    expect(method.isActive).toBe(true);
  });

  it('finds by id, scoped to the store', async () => {
    expect((await repository.findById(storeId, methodId))?.id).toBe(methodId);
    expect(await repository.findById('some-other-store', methodId)).toBeNull();
  });

  it('lists every method for the store', async () => {
    const all = await repository.list(storeId);
    expect(all.map((m) => m.id)).toContain(methodId);
  });

  it('updates fields selectively, leaving the rest untouched', async () => {
    const updated = await repository.update(storeId, methodId, { minDays: 2, maxDays: 4 });
    expect(updated.minDays).toBe(2);
    expect(updated.maxDays).toBe(4);
    expect(updated.name).toBe('Standard Delivery');
  });

  it('deactivates a method', async () => {
    const updated = await repository.update(storeId, methodId, { isActive: false });
    expect(updated.isActive).toBe(false);
  });

  it('throws ShippingMethodNotFoundError when updating an unknown method', async () => {
    await expect(
      repository.update(storeId, 'missing-method', { name: 'Nope' }),
    ).rejects.toThrow(ShippingMethodNotFoundError);
  });

  it('throws ShippingMethodNotFoundError when updating a method belonging to another store', async () => {
    await expect(
      repository.update('some-other-store', methodId, { name: 'Nope' }),
    ).rejects.toThrow(ShippingMethodNotFoundError);
  });
});
