import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import { AdminUserNotFoundError } from '../../../identity/domain/errors/identity.errors';
import { PasswordPolicy } from '../../../identity/domain/policies/password-policy';
import {
  ADMIN_USER_REPOSITORY,
  type AdminUserRepository,
} from '../../../identity/domain/repositories/admin-user.repository';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../../identity/domain/services/password-hasher';
import { InvalidCredentialsError } from '../../domain/errors/auth.errors';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository';

export interface ChangePasswordInput {
  adminUserId: string;
  currentPassword: string;
  newPassword: string;
  actor: ActorRef;
}

/**
 * Self-service password change. Revokes every refresh token for this
 * admin on success (ADR 0017 §4) — a password change is a significant
 * security event; the caller (and every other device) must log in again
 * with the new password.
 */
@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly adminUsers: AdminUserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const user = await this.adminUsers.findById(input.adminUserId);
    if (!user) {
      throw new AdminUserNotFoundError(input.adminUserId);
    }

    const currentMatches = await this.passwordHasher.verify(
      input.currentPassword,
      user.passwordHash,
    );
    if (!currentMatches) {
      throw new InvalidCredentialsError();
    }

    PasswordPolicy.validate(input.newPassword);
    const newHash = await this.passwordHasher.hash(input.newPassword);
    user.changePassword(newHash, input.actor);
    await this.adminUsers.save(user);

    await this.refreshTokens.revokeAllForAdminUser(user.id);
  }
}
