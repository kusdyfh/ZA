import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  ADMIN_USER_REPOSITORY,
  type AdminUserRepository,
} from '../../../identity/domain/repositories/admin-user.repository';
import { InvalidRefreshTokenError, RefreshTokenReusedError } from '../../domain/errors/auth.errors';
import { AuthPolicy } from '../../domain/policies/auth-policy';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository';
import { TOKEN_SERVICE, type TokenService } from '../../domain/services/token.service';

export interface RefreshAccessTokenInput {
  refreshToken: string;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface RefreshAccessTokenResult {
  accessToken: string;
  refreshToken: string;
}

/**
 * Refresh token rotation with family-based reuse detection — ADR 0017
 * §2. Every call retires the presented token and issues a new one in
 * the same family; presenting an already-retired token revokes the
 * whole family and forces a fresh login everywhere.
 */
@Injectable()
export class RefreshAccessTokenUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly adminUsers: AdminUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async execute(input: RefreshAccessTokenInput): Promise<RefreshAccessTokenResult> {
    const payload = await this.tokens.verifyRefreshToken(input.refreshToken).catch(() => null);
    if (!payload) {
      throw new InvalidRefreshTokenError();
    }

    const stored = await this.refreshTokens.findByJti(payload.jti);
    if (!stored) {
      throw new InvalidRefreshTokenError();
    }

    if (stored.isRevoked()) {
      await this.refreshTokens.revokeFamily(stored.familyId);
      throw new RefreshTokenReusedError();
    }

    if (stored.isExpired()) {
      throw new InvalidRefreshTokenError();
    }

    const adminUser = await this.adminUsers.findById(stored.adminUserId);
    if (!adminUser || !adminUser.isActive) {
      throw new InvalidRefreshTokenError();
    }

    const newJti = randomUUID();
    stored.revoke(newJti);
    await this.refreshTokens.save(stored);

    const accessToken = await this.tokens.signAccessToken(adminUser.id);
    const refreshToken = await this.tokens.signRefreshToken(
      adminUser.id,
      newJti,
      stored.familyId,
    );

    await this.refreshTokens.create({
      jti: newJti,
      familyId: stored.familyId,
      adminUserId: adminUser.id,
      expiresAt: new Date(Date.now() + AuthPolicy.REFRESH_TOKEN_TTL_SECONDS * 1000),
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    return { accessToken, refreshToken };
  }
}
