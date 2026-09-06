import { Inject, Injectable } from '@nestjs/common';
import {
  CUSTOMER_REFRESH_TOKEN_REPOSITORY,
  type CustomerRefreshTokenRepository,
} from '../../domain/repositories/customer-refresh-token.repository';
import {
  CUSTOMER_TOKEN_SERVICE,
  type CustomerTokenService,
} from '../../domain/services/customer-token.service';

export interface LogoutCustomerInput {
  refreshToken: string;
}

/** Idempotent, same reasoning as staff logout (ADR 0017 §1). */
@Injectable()
export class LogoutCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: CustomerRefreshTokenRepository,
    @Inject(CUSTOMER_TOKEN_SERVICE) private readonly tokens: CustomerTokenService,
  ) {}

  async execute(input: LogoutCustomerInput): Promise<void> {
    const payload = await this.tokens.verifyRefreshToken(input.refreshToken).catch(() => null);
    if (!payload) {
      return;
    }

    const stored = await this.refreshTokens.findByJti(payload.jti);
    if (!stored || stored.isRevoked()) {
      return;
    }

    stored.revoke();
    await this.refreshTokens.save(stored);
  }
}
