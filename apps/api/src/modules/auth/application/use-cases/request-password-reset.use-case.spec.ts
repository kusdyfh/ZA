import { ActorType } from '@za/types';
import { RequestPasswordResetUseCase } from './request-password-reset.use-case';
import type { AdminUserRepository } from '../../../identity/domain/repositories/admin-user.repository';
import { AdminUser } from '../../../identity/domain/entities/admin-user.entity';
import { Email } from '../../../identity/domain/value-objects/email.vo';
import type { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository';

function buildUser(isActive = true): AdminUser {
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

describe('RequestPasswordResetUseCase', () => {
  let adminUsers: jest.Mocked<AdminUserRepository>;
  let passwordResetTokens: jest.Mocked<PasswordResetTokenRepository>;
  let useCase: RequestPasswordResetUseCase;

  beforeEach(() => {
    adminUsers = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      countActiveByRoleId: jest.fn(),
      list: jest.fn(),
    };
    passwordResetTokens = { create: jest.fn(), findByTokenHash: jest.fn(), save: jest.fn() };
    useCase = new RequestPasswordResetUseCase(adminUsers, passwordResetTokens);
  });

  it('creates a reset token and reveals it when revealToken is true (dev/test)', async () => {
    adminUsers.findByEmail.mockResolvedValue(buildUser());

    const result = await useCase.execute({ email: 'jane@example.com', revealToken: true });

    expect(passwordResetTokens.create).toHaveBeenCalledWith(
      expect.objectContaining({ adminUserId: 'user-1' }),
    );
    expect(result.resetToken).toBeDefined();
    expect(typeof result.resetToken).toBe('string');
  });

  it('never reveals the token when revealToken is false (production)', async () => {
    adminUsers.findByEmail.mockResolvedValue(buildUser());

    const result = await useCase.execute({ email: 'jane@example.com', revealToken: false });

    expect(passwordResetTokens.create).toHaveBeenCalled();
    expect(result.resetToken).toBeUndefined();
  });

  it('resolves the same generic shape for an unknown email (anti-enumeration)', async () => {
    adminUsers.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute({ email: 'unknown@example.com', revealToken: true });

    expect(passwordResetTokens.create).not.toHaveBeenCalled();
    expect(result).toEqual({});
  });

  it('resolves the same generic shape for an inactive account', async () => {
    adminUsers.findByEmail.mockResolvedValue(buildUser(false));

    const result = await useCase.execute({ email: 'jane@example.com', revealToken: true });

    expect(passwordResetTokens.create).not.toHaveBeenCalled();
    expect(result).toEqual({});
  });

  it('resolves the same generic shape for a malformed email rather than throwing', async () => {
    const result = await useCase.execute({ email: 'not-an-email', revealToken: true });

    expect(adminUsers.findByEmail).not.toHaveBeenCalled();
    expect(result).toEqual({});
  });
});
