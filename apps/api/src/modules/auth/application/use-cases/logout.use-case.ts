import { Inject, Injectable } from '@nestjs/common';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository';
import { TOKEN_SERVICE, type TokenService } from '../../domain/services/token.service';

export interface LogoutInput {
  refreshToken: string;
}

/**
 * Idempotent by design — an already-expired, already-revoked, or
 * malformed refresh token simply means there's nothing left to revoke,
 * not an error the caller needs to see (the client's goal, "log me
 * out," is already satisfied either way).
 */
@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
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
