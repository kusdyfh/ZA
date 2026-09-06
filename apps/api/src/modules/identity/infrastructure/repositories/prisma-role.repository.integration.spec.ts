import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaRoleRepository } from './prisma-role.repository';

describe('PrismaRoleRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaRoleRepository(prisma);
  const testRoleKey = `TEST_ROLE_${randomUUID()}`;
  const testPermissionKey = `test.integration.${randomUUID()}`;
  let roleId: string;
  let permissionId: string;

  beforeAll(async () => {
    const role = await prisma.role.create({
      data: {
        key: testRoleKey,
        name: 'Integration Test Role',
        description: 'Created by an integration test.',
        isSystem: false,
      },
    });
    roleId = role.id;

    const permission = await prisma.permission.create({
      data: {
        key: testPermissionKey,
        module: 'test',
        action: 'integration',
      },
    });
    permissionId = permission.id;

    await prisma.rolePermission.create({ data: { roleId, permissionId } });
  });

  afterAll(async () => {
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    await prisma.role.deleteMany({ where: { id: roleId } });
    await prisma.permission.deleteMany({ where: { id: permissionId } });
    await prisma.$disconnect();
  });

  it('finds a role by id', async () => {
    const found = await repository.findById(roleId);
    expect(found?.key).toBe(testRoleKey);
  });

  it('finds a role by key', async () => {
    const found = await repository.findByKey(testRoleKey);
    expect(found?.id).toBe(roleId);
  });

  it('returns null for an id that does not exist', async () => {
    const found = await repository.findById(randomUUID());
    expect(found).toBeNull();
  });

  it('includes the seeded roles in list()', async () => {
    const all = await repository.list();
    const keys = all.map((role) => role.key);
    expect(keys).toContain('SUPER_ADMIN');
    expect(keys).toContain(testRoleKey);
  });

  it('loads a role together with its granted permission keys', async () => {
    const result = await repository.findWithPermissions(roleId);
    expect(result).not.toBeNull();
    expect(result?.role.key).toBe(testRoleKey);
    expect(result?.permissionKeys).toEqual([testPermissionKey]);
  });

  it('returns null from findWithPermissions for a missing role', async () => {
    const result = await repository.findWithPermissions(randomUUID());
    expect(result).toBeNull();
  });
});
