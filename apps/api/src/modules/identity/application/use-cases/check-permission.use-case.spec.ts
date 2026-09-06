import { ActorType } from '@za/types';
import { CheckPermissionUseCase } from './check-permission.use-case';
import type { AdminUserRepository } from '../../domain/repositories/admin-user.repository';
import type { RoleRepository } from '../../domain/repositories/role.repository';
import { AuthorizationService } from '../../domain/services/authorization.service';
import { AdminUser } from '../../domain/entities/admin-user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Role } from '../../domain/entities/role.entity';

function buildUser(isActive: boolean): AdminUser {
  return AdminUser.reconstitute({
    id: 'user-1',
    name: 'Jane Doe',
    email: Email.create('jane@example.com'),
    passwordHash: 'hashed',
    roleId: 'role-1',
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

function buildRole(): Role {
  return Role.reconstitute({
    id: 'role-1',
    key: 'MANAGER',
    name: 'Manager',
    description: null,
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('CheckPermissionUseCase', () => {
  let adminUsers: jest.Mocked<AdminUserRepository>;
  let roles: jest.Mocked<RoleRepository>;
  let useCase: CheckPermissionUseCase;

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
    useCase = new CheckPermissionUseCase(adminUsers, roles, new AuthorizationService());
  });

  it('returns false when the user does not exist', async () => {
    adminUsers.findById.mockResolvedValue(null);
    const result = await useCase.execute({ adminUserId: 'missing', permissionKey: 'orders.view' });
    expect(result).toBe(false);
  });

  it('returns false when the user is inactive', async () => {
    adminUsers.findById.mockResolvedValue(buildUser(false));
    const result = await useCase.execute({ adminUserId: 'user-1', permissionKey: 'orders.view' });
    expect(result).toBe(false);
  });

  it('returns false when the role cannot be loaded', async () => {
    adminUsers.findById.mockResolvedValue(buildUser(true));
    roles.findWithPermissions.mockResolvedValue(null);
    const result = await useCase.execute({ adminUserId: 'user-1', permissionKey: 'orders.view' });
    expect(result).toBe(false);
  });

  it('returns true when the active user role grants the permission', async () => {
    adminUsers.findById.mockResolvedValue(buildUser(true));
    roles.findWithPermissions.mockResolvedValue({
      role: buildRole(),
      permissionKeys: ['orders.view'],
    });
    const result = await useCase.execute({ adminUserId: 'user-1', permissionKey: 'orders.view' });
    expect(result).toBe(true);
  });

  it('returns false when the role lacks the permission', async () => {
    adminUsers.findById.mockResolvedValue(buildUser(true));
    roles.findWithPermissions.mockResolvedValue({
      role: buildRole(),
      permissionKeys: ['orders.view'],
    });
    const result = await useCase.execute({
      adminUserId: 'user-1',
      permissionKey: 'settings.manage',
    });
    expect(result).toBe(false);
  });
});
