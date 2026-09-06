import { ActorType, type ActorRef } from '@za/types';
import { CreateAdminUserUseCase } from './create-admin-user.use-case';
import type { AdminUserRepository } from '../../domain/repositories/admin-user.repository';
import type { RoleRepository } from '../../domain/repositories/role.repository';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import { Role } from '../../domain/entities/role.entity';
import { AdminUser } from '../../domain/entities/admin-user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import {
  EmailAlreadyInUseError,
  InvalidAdminUserNameError,
  InvalidEmailError,
  RoleNotFoundError,
  WeakPasswordError,
} from '../../domain/errors/identity.errors';

const systemActor: ActorRef = { actorId: null, actorType: ActorType.SYSTEM };

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

function buildCreatedUser(): AdminUser {
  return AdminUser.reconstitute({
    id: 'user-1',
    name: 'Jane Doe',
    email: Email.create('jane@example.com'),
    passwordHash: 'hashed-password',
    roleId: 'role-1',
    isActive: true,
    deactivatedAt: null,
    createdByActorId: null,
    createdByActorType: ActorType.SYSTEM,
    updatedByActorId: null,
    updatedByActorType: ActorType.SYSTEM,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('CreateAdminUserUseCase', () => {
  let adminUsers: jest.Mocked<AdminUserRepository>;
  let roles: jest.Mocked<RoleRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let useCase: CreateAdminUserUseCase;

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
    passwordHasher = { hash: jest.fn(), verify: jest.fn() };
    useCase = new CreateAdminUserUseCase(adminUsers, roles, passwordHasher);
  });

  it('hashes the password and creates the admin user when everything is valid', async () => {
    roles.findById.mockResolvedValue(buildRole());
    adminUsers.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed-password');
    adminUsers.create.mockResolvedValue(buildCreatedUser());

    const result = await useCase.execute({
      name: 'Jane Doe',
      email: 'Jane@Example.com',
      password: 'longenough1',
      roleId: 'role-1',
      actor: systemActor,
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith('longenough1');
    expect(adminUsers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Jane Doe',
        passwordHash: 'hashed-password',
        roleId: 'role-1',
        actor: systemActor,
      }),
    );
    expect(result.id).toBe('user-1');
  });

  it('throws RoleNotFoundError and never creates the user when the role is missing', async () => {
    roles.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'longenough1',
        roleId: 'missing-role',
        actor: systemActor,
      }),
    ).rejects.toThrow(RoleNotFoundError);
    expect(adminUsers.create).not.toHaveBeenCalled();
  });

  it('throws EmailAlreadyInUseError when the email is already registered', async () => {
    roles.findById.mockResolvedValue(buildRole());
    adminUsers.findByEmail.mockResolvedValue(buildCreatedUser());

    await expect(
      useCase.execute({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'longenough1',
        roleId: 'role-1',
        actor: systemActor,
      }),
    ).rejects.toThrow(EmailAlreadyInUseError);
    expect(adminUsers.create).not.toHaveBeenCalled();
  });

  it('throws WeakPasswordError before touching any repository', async () => {
    await expect(
      useCase.execute({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'short',
        roleId: 'role-1',
        actor: systemActor,
      }),
    ).rejects.toThrow(WeakPasswordError);
    expect(roles.findById).not.toHaveBeenCalled();
  });

  it('throws InvalidEmailError for a malformed email', async () => {
    await expect(
      useCase.execute({
        name: 'Jane Doe',
        email: 'not-an-email',
        password: 'longenough1',
        roleId: 'role-1',
        actor: systemActor,
      }),
    ).rejects.toThrow(InvalidEmailError);
  });

  it('throws InvalidAdminUserNameError for a blank name', async () => {
    await expect(
      useCase.execute({
        name: '   ',
        email: 'jane@example.com',
        password: 'longenough1',
        roleId: 'role-1',
        actor: systemActor,
      }),
    ).rejects.toThrow(InvalidAdminUserNameError);
  });
});
