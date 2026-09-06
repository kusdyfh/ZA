import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaPermissionRepository } from './prisma-permission.repository';

describe('PrismaPermissionRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaPermissionRepository(prisma);
  const testKey = `test.integration.${randomUUID()}`;

  afterAll(async () => {
    await prisma.permission.deleteMany({ where: { key: testKey } });
    await prisma.$disconnect();
  });

  it('persists a permission and reads it back by key', async () => {
    await prisma.permission.create({
      data: {
        key: testKey,
        module: 'test',
        action: 'integration',
        description: 'Created by an integration test.',
      },
    });

    const found = await repository.findByKey(testKey);

    expect(found).not.toBeNull();
    expect(found?.key).toBe(testKey);
    expect(found?.module).toBe('test');
    expect(found?.action).toBe('integration');
  });

  it('returns null for a key that does not exist', async () => {
    const found = await repository.findByKey(`missing.${randomUUID()}`);
    expect(found).toBeNull();
  });

  it('includes the seeded permission set in list()', async () => {
    const all = await repository.list();
    const keys = all.map((permission) => permission.key);

    expect(keys).toContain('products.view');
    expect(keys).toContain(testKey);
  });
});
