import { ActorType, type ActorRef } from '@za/types';
import { ChangeAdminUserRoleUseCase } from './change-admin-user-role.use-case';
import type { AdminUserRepository } from '../../domain/repositories/admin-user.repository';
import type { RoleRepository } from '../../domain/repositories/role.repository';
import { Role } from '../../domain/entities/role.entity';
import { AdminUser } from '../../domain/entities/admin-user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { ROLE_KEYS } from '../../domain/constants/roles.constants';
import { AdminUserNotFoundError, LastSuperAdminError, RoleNotFoundError } from '../../domain/errors/identity.errors';

const actor: ActorRef = { actorId: 'admin-1', actorType: ActorType.ADMIN };

function buildRole(id: string, key: string): Role {
  return Role.reconstitute({
    id,
    key,
    name: key,
    description: null,
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUser(roleId: string, isActive = true): AdminUser {
  return AdminUser.reconstitute({
    id: 'user-1',
    name: 'Jane Doe',
    email: Email.create('jane@example.com'),
    passwordHash: 'hashed',
    roleId,
    isActive,
    deactivatedAt: null,
    createdByActorId: null,
    createdByActorType: ActorType.SYSTEM,
    updatedByActorId: null,
    updatedByActorType: ActorType.SYSTEM,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ChangeAdminUserRoleUseCase', () => {
  let adminUsers: jest.Mocked<AdminUserRepository>;
  let roles: jest.Mocked<RoleRepository>;
  let useCase: ChangeAdminUserRoleUseCase;

  beforeEach(() => {
    adminUsers = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      countActiveByRoleId: jest.fn(),
      list: jest.fn(),
    };
    roles = {
      findById: jest.fn(),
      findByKey: jest.fn(),
      list: jest.fn(),
      findWithPermissions: jest.fn(),
    };
    useCase = new ChangeAdminUserRoleUseCase(adminUsers, roles);
  });

  it('throws AdminUserNotFoundError when the user does not exist', async () => {
    adminUsers.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ adminUserId: 'missing', newRoleId: 'role-2', actor }),
    ).rejects.toThrow(AdminUserNotFoundError);
  });

  it('throws RoleNotFoundError when the target role does not exist', async () => {
    adminUsers.findById.mockResolvedValue(buildUser('role-1'));
    roles.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ adminUserId: 'user-1', newRoleId: 'missing-role', actor }),
    ).rejects.toThrow(RoleNotFoundError);
  });

  it('throws LastSuperAdminError when moving the last active Super Admin to another role', async () => {
    const user = buildUser('role-super');
    adminUsers.findById.mockResolvedValue(user);
    roles.findById.mockImplementation((id: string) => {
      if (id === 'role-manager') return Promise.resolve(buildRole('role-manager', ROLE_KEYS.MANAGER));
      if (id === 'role-super') return Promise.resolve(buildRole('role-super', ROLE_KEYS.SUPER_ADMIN));
      return Promise.resolve(null);
    });
    adminUsers.countActiveByRoleId.mockResolvedValue(1);

    await expect(
      useCase.execute({ adminUserId: 'user-1', newRoleId: 'role-manager', actor }),
    ).rejects.toThrow(LastSuperAdminError);
    expect(adminUsers.save).not.toHaveBeenCalled();
  });

  it('allows moving a Super Admin away when another active Super Admin remains', async () => {
    const user = buildUser('role-super');
    adminUsers.findById.mockResolvedValue(user);
    roles.findById.mockImplementation((id: string) => {
      if (id === 'role-manager') return Promise.resolve(buildRole('role-manager', ROLE_KEYS.MANAGER));
      if (id === 'role-super') return Promise.resolve(buildRole('role-super', ROLE_KEYS.SUPER_ADMIN));
      return Promise.resolve(null);
    });
    adminUsers.countActiveByRoleId.mockResolvedValue(2);

    const result = await useCase.execute({
      adminUserId: 'user-1',
      newRoleId: 'role-manager',
      actor,
    });

    expect(result.roleId).toBe('role-manager');
    expect(adminUsers.save).toHaveBeenCalledWith(user);
  });

  it('skips the invariant check when the new role is the same as the current role', async () => {
    const user = buildUser('role-super');
    adminUsers.findById.mockResolvedValue(user);
    roles.findById.mockResolvedValue(buildRole('role-super', ROLE_KEYS.SUPER_ADMIN));

    await useCase.execute({ adminUserId: 'user-1', newRoleId: 'role-super', actor });

    expect(adminUsers.countActiveByRoleId).not.toHaveBeenCalled();
    expect(adminUsers.save).toHaveBeenCalledWith(user);
  });

  it('skips the invariant check for an already-inactive user', async () => {
    const user = buildUser('role-super', false);
    adminUsers.findById.mockResolvedValue(user);
    roles.findById.mockResolvedValue(buildRole('role-manager', ROLE_KEYS.MANAGER));

    await useCase.execute({ adminUserId: 'user-1', newRoleId: 'role-manager', actor });

    expect(adminUsers.countActiveByRoleId).not.toHaveBeenCalled();
    expect(adminUsers.save).toHaveBeenCalledWith(user);
  });
});
