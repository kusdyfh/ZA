import { ActorType, type ActorRef } from '@za/types';
import { ActivateAdminUserUseCase } from './activate-admin-user.use-case';
import type { AdminUserRepository } from '../../domain/repositories/admin-user.repository';
import { AdminUser } from '../../domain/entities/admin-user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { AdminUserNotFoundError } from '../../domain/errors/identity.errors';

const actor: ActorRef = { actorId: 'admin-1', actorType: ActorType.ADMIN };

function buildInactiveUser(): AdminUser {
  return AdminUser.reconstitute({
    id: 'user-1',
    name: 'Jane Doe',
    email: Email.create('jane@example.com'),
    passwordHash: 'hashed',
    roleId: 'role-1',
    isActive: false,
    deactivatedAt: new Date(),
    createdByActorId: null,
    createdByActorType: ActorType.SYSTEM,
    updatedByActorId: null,
    updatedByActorType: ActorType.SYSTEM,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ActivateAdminUserUseCase', () => {
  let adminUsers: jest.Mocked<AdminUserRepository>;
  let useCase: ActivateAdminUserUseCase;

  beforeEach(() => {
    adminUsers = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      countActiveByRoleId: jest.fn(),
      list: jest.fn(),
    };
    useCase = new ActivateAdminUserUseCase(adminUsers);
  });

  it('throws AdminUserNotFoundError when the user does not exist', async () => {
    adminUsers.findById.mockResolvedValue(null);
    await expect(useCase.execute({ adminUserId: 'missing', actor })).rejects.toThrow(
      AdminUserNotFoundError,
    );
  });

  it('activates the user and persists the change', async () => {
    const user = buildInactiveUser();
    adminUsers.findById.mockResolvedValue(user);

    const result = await useCase.execute({ adminUserId: 'user-1', actor });

    expect(result.isActive).toBe(true);
    expect(result.deactivatedAt).toBeNull();
    expect(adminUsers.save).toHaveBeenCalledWith(user);
  });
});
