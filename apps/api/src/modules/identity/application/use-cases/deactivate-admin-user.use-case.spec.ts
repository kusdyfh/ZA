import { ActorType, type ActorRef } from '@za/types';
import { DeactivateAdminUserUseCase } from './deactivate-admin-user.use-case';
import type { AdminUserRepository } from '../../domain/repositories/admin-user.repository';
import type { RoleRepository } from '../../domain/repositories/role.repository';
import { Role } from '../../domain/entities/role.entity';
import { AdminUser } from '../../domain/entities/admin-user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { ROLE_KEYS } from '../../domain/constants/roles.constants';
import { AdminUserNotFoundError, LastSuperAdminError } from '../../domain/errors/identity.errors';

const actor: ActorRef = { actorId: 'admin-1', actorType: ActorType.ADMIN };

function buildRole(key: string): Role {
  return Role.reconstitute({
    id: `role-${key}`,
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

describe('DeactivateAdminUserUseCase', () => {
  let adminUsers: jest.Mocked<AdminUserRepository>;
  let roles: jest.Mocked<RoleRepository>;
  let useCase: DeactivateAdminUserUseCase;

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
    useCase = new DeactivateAdminUserUseCase(adminUsers, roles);
  });

  it('throws AdminUserNotFoundError when the user does not exist', async () => {
    adminUsers.findById.mockResolvedValue(null);
    await expect(useCase.execute({ adminUserId: 'missing', actor })).rejects.toThrow(
      AdminUserNotFoundError,
    );
  });

  it('throws LastSuperAdminError when deactivating the last active Super Admin', async () => {
    const user = buildUser('role-SUPER_ADMIN');
    adminUsers.findById.mockResolvedValue(user);
    roles.findById.mockResolvedValue(buildRole(ROLE_KEYS.SUPER_ADMIN));
    adminUsers.countActiveByRoleId.mockResolvedValue(1);

    await expect(useCase.execute({ adminUserId: 'user-1', actor })).rejects.toThrow(
      LastSuperAdminError,
    );
    expect(adminUsers.save).not.toHaveBeenCalled();
  });

  it('allows deactivating a Super Admin when another active Super Admin remains', async () => {
    const user = buildUser('role-SUPER_ADMIN');
    adminUsers.findById.mockResolvedValue(user);
    roles.findById.mockResolvedValue(buildRole(ROLE_KEYS.SUPER_ADMIN));
    adminUsers.countActiveByRoleId.mockResolvedValue(2);

    await useCase.execute({ adminUserId: 'user-1', actor });

    expect(user.isActive).toBe(false);
    expect(adminUsers.save).toHaveBeenCalledWith(user);
  });

  it('allows deactivating a non-Super-Admin regardless of active count', async () => {
    const user = buildUser('role-MANAGER');
    adminUsers.findById.mockResolvedValue(user);
    roles.findById.mockResolvedValue(buildRole(ROLE_KEYS.MANAGER));

    await useCase.execute({ adminUserId: 'user-1', actor });

    expect(user.isActive).toBe(false);
    expect(adminUsers.countActiveByRoleId).not.toHaveBeenCalled();
    expect(adminUsers.save).toHaveBeenCalledWith(user);
  });

  it('does not re-check the invariant when the user is already inactive', async () => {
    const user = buildUser('role-SUPER_ADMIN', false);
    adminUsers.findById.mockResolvedValue(user);

    await useCase.execute({ adminUserId: 'user-1', actor });

    expect(roles.findById).not.toHaveBeenCalled();
    expect(adminUsers.save).toHaveBeenCalledWith(user);
  });
});
