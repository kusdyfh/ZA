import { Inject, Injectable } from '@nestjs/common';
import { SessionNotFoundError } from '../../domain/errors/auth.errors';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository';

export interface RevokeSessionInput {
  adminUserId: string;
  sessionId: string;
}

/**
 * Self-service only — an admin may revoke one of their own sessions, not
 * another admin's (ADR 0017 §3's "no moderation feature" scope note).
 * Scoping the lookup to `listActiveByAdminUserId` (rather than a bare
 * findById) is what enforces that: a session id belonging to a
 * different admin simply won't be found.
 */
@Injectable()
export class RevokeSessionUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async execute(input: RevokeSessionInput): Promise<void> {
    const sessions = await this.refreshTokens.listActiveByAdminUserId(
      input.adminUserId,
      new Date(),
    );
    const session = sessions.find((candidate) => candidate.id === input.sessionId);
    if (!session) {
      throw new SessionNotFoundError(input.sessionId);
    }

    session.revoke();
    await this.refreshTokens.save(session);
  }
}
