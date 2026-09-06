import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Email } from '../../../identity/domain/value-objects/email.vo';
import {
  ADMIN_USER_REPOSITORY,
  type AdminUserRepository,
} from '../../../identity/domain/repositories/admin-user.repository';
import { AuthPolicy } from '../../domain/policies/auth-policy';
import {
  PASSWORD_RESET_TOKEN_REPOSITORY,
  type PasswordResetTokenRepository,
} from '../../domain/repositories/password-reset-token.repository';

export interface RequestPasswordResetInput {
  email: string;
  /**
   * Decided by the controller from `NODE_ENV`, not read from `process.env`
   * here — keeps this use-case pure/testable. See ADR 0017 §4: the raw
   * token is only ever revealed outside production, as a disclosed
   * stand-in until a Notifications epic emails the real reset link.
   */
  revealToken: boolean;
}

export interface RequestPasswordResetResult {
  resetToken?: string;
}

/**
 * Always resolves the same way whether or not the email exists — per
 * docs/product/01-AUTHENTICATION.md's anti-enumeration rule, the
 * controller returns an identical generic message regardless of this
 * result's shape.
 */
@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly adminUsers: AdminUserRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly passwordResetTokens: PasswordResetTokenRepository,
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<RequestPasswordResetResult> {
    let user;
    try {
      const email = Email.create(input.email);
      user = await this.adminUsers.findByEmail(email);
    } catch {
      return {};
    }

    if (!user || !user.isActive) {
      return {};
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(
      Date.now() + AuthPolicy.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60_000,
    );

    await this.passwordResetTokens.create({
      tokenHash,
      adminUserId: user.id,
      expiresAt,
      rawToken,
      email: user.email.toString(),
    });

    return input.revealToken ? { resetToken: rawToken } : {};
  }
}
