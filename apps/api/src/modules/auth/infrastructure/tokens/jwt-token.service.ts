import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AppConfig } from '../../../../shared/config/configuration';
import { AuthPolicy } from '../../domain/policies/auth-policy';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenService,
} from '../../domain/services/token.service';

/**
 * Concrete `TokenService` (ADR 0017 §1) — HS256 JWTs via `@nestjs/jwt`,
 * one secret per token type so a leaked access-token secret can't be
 * used to forge refresh tokens or vice versa. `JwtModule` is registered
 * without a default secret (see AuthModule) specifically so every call
 * site here must pass its secret explicitly — there's no ambient
 * default to accidentally use for the wrong token type.
 */
@Injectable()
export class JwtTokenService implements TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    const appConfig = configService.getOrThrow<AppConfig>('app');
    this.accessSecret = appConfig.jwtAccessSecret;
    this.refreshSecret = appConfig.jwtRefreshSecret;
  }

  signAccessToken(adminUserId: string): Promise<string> {
    const payload: AccessTokenPayload = { sub: adminUserId, type: 'access' };
    return this.jwtService.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: AuthPolicy.ACCESS_TOKEN_TTL_SECONDS,
    });
  }

  signRefreshToken(adminUserId: string, jti: string, familyId: string): Promise<string> {
    const payload: RefreshTokenPayload = { sub: adminUserId, jti, familyId, type: 'refresh' };
    return this.jwtService.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: AuthPolicy.REFRESH_TOKEN_TTL_SECONDS,
    });
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
      secret: this.accessSecret,
    });
    if (payload.type !== 'access') {
      throw new Error('Not an access token.');
    }
    return payload;
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
      secret: this.refreshSecret,
    });
    if (payload.type !== 'refresh') {
      throw new Error('Not a refresh token.');
    }
    return payload;
  }
}
