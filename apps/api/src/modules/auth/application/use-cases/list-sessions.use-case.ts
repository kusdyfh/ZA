import { Inject, Injectable } from '@nestjs/common';
import type { RefreshToken } from '../../domain/entities/refresh-token.entity';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository';

export interface ListSessionsInput {
  adminUserId: string;
}

/** ADR 0017 §3 — a "session" is an active (non-revoked, non-expired) RefreshToken row. */
@Injectable()
export class ListSessionsUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async execute(input: ListSessionsInput): Promise<RefreshToken[]> {
    return this.refreshTokens.listActiveByAdminUserId(input.adminUserId, new Date());
  }
}
