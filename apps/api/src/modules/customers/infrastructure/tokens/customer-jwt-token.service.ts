import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AppConfig } from '../../../../shared/config/configuration';
import { CustomerPolicy } from '../../domain/policies/customer-policy';
import type {
  CustomerAccessTokenPayload,
  CustomerRefreshTokenPayload,
  CustomerTokenService,
} from '../../domain/services/customer-token.service';

/** Concrete `CustomerTokenService` (ADR 0018 §2) — separate secrets from staff's JwtTokenService, same shape otherwise. */
@Injectable()
export class CustomerJwtTokenService implements CustomerTokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    const appConfig = configService.getOrThrow<AppConfig>('app');
    this.accessSecret = appConfig.customerJwtAccessSecret;
    this.refreshSecret = appConfig.customerJwtRefreshSecret;
  }

  signAccessToken(customerId: string): Promise<string> {
    const payload: CustomerAccessTokenPayload = { sub: customerId, type: 'customer-access' };
    return this.jwtService.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: CustomerPolicy.ACCESS_TOKEN_TTL_SECONDS,
    });
  }

  signRefreshToken(customerId: string, jti: string, familyId: string): Promise<string> {
    const payload: CustomerRefreshTokenPayload = {
      sub: customerId,
      jti,
      familyId,
      type: 'customer-refresh',
    };
    return this.jwtService.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: CustomerPolicy.REFRESH_TOKEN_TTL_SECONDS,
    });
  }

  async verifyAccessToken(token: string): Promise<CustomerAccessTokenPayload> {
    const payload = await this.jwtService.verifyAsync<CustomerAccessTokenPayload>(token, {
      secret: this.accessSecret,
    });
    if (payload.type !== 'customer-access') {
      throw new Error('Not a customer access token.');
    }
    return payload;
  }

  async verifyRefreshToken(token: string): Promise<CustomerRefreshTokenPayload> {
    const payload = await this.jwtService.verifyAsync<CustomerRefreshTokenPayload>(token, {
      secret: this.refreshSecret,
    });
    if (payload.type !== 'customer-refresh') {
      throw new Error('Not a customer refresh token.');
    }
    return payload;
  }
}
