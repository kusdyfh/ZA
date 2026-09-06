import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { AdminUser } from '../../../identity/domain/entities/admin-user.entity';
import { Email } from '../../../identity/domain/value-objects/email.vo';
import {
  ADMIN_USER_REPOSITORY,
  type AdminUserRepository,
} from '../../../identity/domain/repositories/admin-user.repository';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../../identity/domain/services/password-hasher';
import { InvalidCredentialsError } from '../../domain/errors/auth.errors';
import { AuthPolicy } from '../../domain/policies/auth-policy';
import {
  LOGIN_HISTORY_REPOSITORY,
  type LoginHistoryRepository,
} from '../../domain/repositories/login-history.repository';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository';
import { TOKEN_SERVICE, type TokenService } from '../../domain/services/token.service';

export interface LoginInput {
  email: string;
  password: string;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  adminUser: AdminUser;
}

/**
 * ADR 0017 §1/§5. Every outcome — unknown email, wrong password, inactive
 * account, or success — is recorded to LoginHistory; only success ever
 * avoids throwing InvalidCredentialsError, whose message never reveals
 * which of those three failure reasons applies (anti-enumeration, per
 * docs/product/01-AUTHENTICATION.md).
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly adminUsers: AdminUserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(LOGIN_HISTORY_REPOSITORY) private readonly loginHistory: LoginHistoryRepository,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    let adminUser: AdminUser | null = null;
    let failureReason: string | null = null;

    try {
      const email = Email.create(input.email);
      adminUser = await this.adminUsers.findByEmail(email);
    } catch {
      failureReason = 'INVALID_EMAIL_FORMAT';
    }

    if (!failureReason) {
      if (!adminUser) {
        failureReason = 'UNKNOWN_EMAIL';
      } else if (!adminUser.isActive) {
        failureReason = 'ACCOUNT_INACTIVE';
      } else {
        const passwordMatches = await this.passwordHasher.verify(
          input.password,
          adminUser.passwordHash,
        );
        if (!passwordMatches) {
          failureReason = 'INVALID_PASSWORD';
        }
      }
    }

    await this.loginHistory.record({
      adminUserId: adminUser?.id ?? null,
      emailAttempted: input.email,
      success: failureReason === null,
      failureReason,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    if (failureReason !== null || !adminUser) {
      throw new InvalidCredentialsError();
    }

    const familyId = randomUUID();
    const jti = randomUUID();
    const accessToken = await this.tokens.signAccessToken(adminUser.id);
    const refreshToken = await this.tokens.signRefreshToken(adminUser.id, jti, familyId);

    await this.refreshTokens.create({
      jti,
      familyId,
      adminUserId: adminUser.id,
      expiresAt: new Date(Date.now() + AuthPolicy.REFRESH_TOKEN_TTL_SECONDS * 1000),
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    return { accessToken, refreshToken, adminUser };
  }
}
