import { randomUUID } from 'node:crypto';
import { ActorType } from '@za/types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaAdminUserRepository } from './prisma-admin-user.repository';
import { Email } from '../../domain/value-objects/email.vo';

describe('PrismaAdminUserRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaAdminUserRepository(prisma);
  const testRoleKey = `TEST_ROLE_${randomUUID()}`;
  const testEmail = `integration.${randomUUID()}@example.com`;
  let roleId: string;
  let secondRoleId: string;
  let userId: string;

  beforeAll(async () => {
    const role = await prisma.role.create({
      data: { key: testRoleKey, name: 'Integration Test Role', isSystem: false },
    });
    roleId = role.id;

    const secondRole = await prisma.role.create({
      data: { key: `${testRoleKey}_ALT`, name: 'Integration Test Role Alt', isSystem: false },
    });
    secondRoleId = secondRole.id;
  });

  afterAll(async () => {
    await prisma.adminUser.deleteMany({ where: { roleId: { in: [roleId, secondRoleId] } } });
    await prisma.role.deleteMany({ where: { id: { in: [roleId, secondRoleId] } } });
    await prisma.$disconnect();
  });

  it('creates an admin user and stamps the actor', async () => {
    const user = await repository.create({
      name: 'Integration Test User',
      email: Email.create(testEmail),
      passwordHash: 'not-a-real-hash',
      roleId,
      actor: { actorId: null, actorType: ActorType.SYSTEM },
    });

    userId = user.id;
    expect(user.email.toString()).toBe(testEmail);
    expect(user.isActive).toBe(true);
    expect(user.toProps().createdByActorType).toBe(ActorType.SYSTEM);
  });

  it('finds the user by id', async () => {
    const found = await repository.findById(userId);
    expect(found?.email.toString()).toBe(testEmail);
  });

  it('finds the user by email', async () => {
    const found = await repository.findByEmail(Email.create(testEmail));
    expect(found?.id).toBe(userId);
  });

  it('returns null for an email that does not exist', async () => {
    const found = await repository.findByEmail(Email.create(`missing.${randomUUID()}@example.com`));
    expect(found).toBeNull();
  });

  it('persists deactivate()/activate()/changeRole() mutations via save()', async () => {
    const user = await repository.findById(userId);
    expect(user).not.toBeNull();

    user!.deactivate({ actorId: 'admin-1', actorType: ActorType.ADMIN });
    user!.changeRole(secondRoleId, { actorId: 'admin-1', actorType: ActorType.ADMIN });
    await repository.save(user!);

    const reloaded = await repository.findById(userId);
    expect(reloaded?.isActive).toBe(false);
    expect(reloaded?.deactivatedAt).not.toBeNull();
    expect(reloaded?.roleId).toBe(secondRoleId);
    expect(reloaded?.toProps().updatedByActorId).toBe('admin-1');
  });

  it('counts only active users for a given role', async () => {
    const activeBeforeReactivation = await repository.countActiveByRoleId(secondRoleId);
    expect(activeBeforeReactivation).toBe(0);

    const user = await repository.findById(userId);
    user!.activate({ actorId: 'admin-1', actorType: ActorType.ADMIN });
    await repository.save(user!);

    const activeAfterReactivation = await repository.countActiveByRoleId(secondRoleId);
    expect(activeAfterReactivation).toBe(1);
  });

  it('includes the created user in list()', async () => {
    const all = await repository.list();
    const emails = all.map((user) => user.email.toString());
    expect(emails).toContain(testEmail);
  });
});
