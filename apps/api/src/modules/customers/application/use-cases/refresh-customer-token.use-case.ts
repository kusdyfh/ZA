import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { CUSTOMER_REPOSITORY, type CustomerRepository } from '../../domain/repositories/customer.repository';
import { CustomerPolicy } from '../../domain/policies/customer-policy';
import { InvalidRefreshTokenError, RefreshTokenReusedError } from '../../domain/errors/customer.errors';
import {
  CUSTOMER_REFRESH_TOKEN_REPOSITORY,
  type CustomerRefreshTokenRepository,
} from '../../domain/repositories/customer-refresh-token.repository';
import {
  CUSTOMER_TOKEN_SERVICE,
  type CustomerTokenService,
} from '../../domain/services/customer-token.service';

export interface RefreshCustomerTokenInput {
  refreshToken: string;
}

export interface RefreshCustomerTokenResult {
  accessToken: string;
  refreshToken: string;
}

/** Rotation with family-wide reuse detection — identical shape to staff auth (ADR 0017 §2 / ADR 0018 §2). */
@Injectable()
export class RefreshCustomerTokenUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customers: CustomerRepository,
    @Inject(CUSTOMER_REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: CustomerRefreshTokenRepository,
    @Inject(CUSTOMER_TOKEN_SERVICE) private readonly tokens: CustomerTokenService,
  ) {}

  async execute(input: RefreshCustomerTokenInput): Promise<RefreshCustomerTokenResult> {
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

    const customer = await this.customers.findById(stored.customerId);
    if (!customer) {
      throw new InvalidRefreshTokenError();
    }

    const newJti = randomUUID();
    stored.revoke(newJti);
    await this.refreshTokens.save(stored);

    const accessToken = await this.tokens.signAccessToken(customer.id);
    const refreshToken = await this.tokens.signRefreshToken(customer.id, newJti, stored.familyId);
    await this.refreshTokens.create({
      jti: newJti,
      familyId: stored.familyId,
      customerId: customer.id,
      expiresAt: new Date(Date.now() + CustomerPolicy.REFRESH_TOKEN_TTL_SECONDS * 1000),
    });

    return { accessToken, refreshToken };
  }
}
