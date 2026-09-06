import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ActorType } from '@za/types';
import { PasswordPolicy } from '../../../identity/domain/policies/password-policy';
import {
  ADMIN_USER_REPOSITORY,
  type AdminUserRepository,
} from '../../../identity/domain/repositories/admin-user.repository';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../../identity/domain/services/password-hasher';
import { InvalidPasswordResetTokenError } from '../../domain/errors/auth.errors';
import {
  PASSWORD_RESET_TOKEN_REPOSITORY,
  type PasswordResetTokenRepository,
} from '../../domain/repositories/password-reset-token.repository';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository';

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

/**
 * Completes a password reset (ADR 0017 §4) — single-use token, then
 * revokes every existing session, same as ChangePasswordUseCase. The
 * actor recorded on the AdminUser update is the account itself
 * (ActorType.ADMIN) since there's no separate authenticated caller here
 * — the reset token IS the proof of identity.
 */
@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly adminUsers: AdminUserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly passwordResetTokens: PasswordResetTokenRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const tokenHash = createHash('sha256').update(input.token).digest('hex');
    const resetToken = await this.passwordResetTokens.findByTokenHash(tokenHash);
    if (!resetToken || !resetToken.isValid()) {
      throw new InvalidPasswordResetTokenError();
    }

    const user = await this.adminUsers.findById(resetToken.adminUserId);
    if (!user || !user.isActive) {
      throw new InvalidPasswordResetTokenError();
    }

    PasswordPolicy.validate(input.newPassword);
    const newHash = await this.passwordHasher.hash(input.newPassword);
    user.changePassword(newHash, { actorId: user.id, actorType: ActorType.ADMIN });
    await this.adminUsers.save(user);

    resetToken.markUsed();
    await this.passwordResetTokens.save(resetToken);

    await this.refreshTokens.revokeAllForAdminUser(user.id);
  }
}
