import type { PasswordResetToken } from '../entities/password-reset-token.entity';

export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol('PASSWORD_RESET_TOKEN_REPOSITORY');

export interface CreatePasswordResetTokenData {
  tokenHash: string;
  adminUserId: string;
  expiresAt: Date;
  /**
   * Epic 11 (ADR 0023/0024) — the raw token and the user's email, used
   * only to build the `PasswordResetRequested` outbox event's payload
   * (the reset-link email); never persisted to `PasswordResetToken`
   * itself, which stores only `tokenHash`. The use-case already has both
   * values before calling `create()`.
   */
  rawToken: string;
  email: string;
}

export interface PasswordResetTokenRepository {
  create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  save(token: PasswordResetToken): Promise<void>;
}
