import { ActorType, type ActorRef } from '@za/types';
import { ChangePasswordUseCase } from './change-password.use-case';
import type { AdminUserRepository } from '../../../identity/domain/repositories/admin-user.repository';
import type { PasswordHasher } from '../../../identity/domain/services/password-hasher';
import { AdminUser } from '../../../identity/domain/entities/admin-user.entity';
import { Email } from '../../../identity/domain/value-objects/email.vo';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { InvalidCredentialsError } from '../../domain/errors/auth.errors';
import { AdminUserNotFoundError, WeakPasswordError } from '../../../identity/domain/errors/identity.errors';

const actor: ActorRef = { actorId: 'user-1', actorType: ActorType.ADMIN };

function buildUser(): AdminUser {
  return AdminUser.reconstitute({
    id: 'user-1',
    name: 'Jane Doe',
    email: Email.create('jane@example.com'),
    passwordHash: 'old-hash',
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

describe('ChangePasswordUseCase', () => {
  let adminUsers: jest.Mocked<AdminUserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let refreshTokens: jest.Mocked<RefreshTokenRepository>;
  let useCase: ChangePasswordUseCase;

  const input = {
    adminUserId: 'user-1',
    currentPassword: 'old-password',
    newPassword: 'new-long-password',
    actor,
  };

  beforeEach(() => {
    adminUsers = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      countActiveByRoleId: jest.fn(),
      list: jest.fn(),
    };
    passwordHasher = { hash: jest.fn(), verify: jest.fn() };
    refreshTokens = {
      create: jest.fn(),
      findByJti: jest.fn(),
      save: jest.fn(),
      listActiveByAdminUserId: jest.fn(),
      revokeFamily: jest.fn(),
      revokeAllForAdminUser: jest.fn(),
    };
    useCase = new ChangePasswordUseCase(adminUsers, passwordHasher, refreshTokens);
  });

  it('changes the password and revokes every session on success', async () => {
    const user = buildUser();
    adminUsers.findById.mockResolvedValue(user);
    passwordHasher.verify.mockResolvedValue(true);
    passwordHasher.hash.mockResolvedValue('new-hash');

    await useCase.execute(input);

    expect(passwordHasher.verify).toHaveBeenCalledWith('old-password', 'old-hash');
    expect(passwordHasher.hash).toHaveBeenCalledWith('new-long-password');
    expect(adminUsers.save).toHaveBeenCalledWith(user);
    expect(user.passwordHash).toBe('new-hash');
    expect(refreshTokens.revokeAllForAdminUser).toHaveBeenCalledWith('user-1');
  });

  it('rejects when the current password is wrong', async () => {
    adminUsers.findById.mockResolvedValue(buildUser());
    passwordHasher.verify.mockResolvedValue(false);

    await expect(useCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    expect(adminUsers.save).not.toHaveBeenCalled();
    expect(refreshTokens.revokeAllForAdminUser).not.toHaveBeenCalled();
  });

  it('rejects a weak new password before touching any repository', async () => {
    adminUsers.findById.mockResolvedValue(buildUser());
    passwordHasher.verify.mockResolvedValue(true);

    await expect(
      useCase.execute({ ...input, newPassword: 'short' }),
    ).rejects.toThrow(WeakPasswordError);
    expect(adminUsers.save).not.toHaveBeenCalled();
  });

  it('throws AdminUserNotFoundError if the admin no longer exists', async () => {
    adminUsers.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(AdminUserNotFoundError);
  });
});
