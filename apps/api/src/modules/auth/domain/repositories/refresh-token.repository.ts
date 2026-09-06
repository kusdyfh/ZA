import type { RefreshToken } from '../entities/refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface CreateRefreshTokenData {
  jti: string;
  familyId: string;
  adminUserId: string;
  expiresAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface RefreshTokenRepository {
  create(data: CreateRefreshTokenData): Promise<RefreshToken>;
  findByJti(jti: string): Promise<RefreshToken | null>;
  save(token: RefreshToken): Promise<void>;
  /** Lists every session (active or not) for the "list sessions" endpoint to filter client-side isn't needed — only active ones are ever returned. */
  listActiveByAdminUserId(adminUserId: string, now: Date): Promise<RefreshToken[]>;
  /** Reuse detection (ADR 0017 §2) — revokes every non-revoked token sharing a family in one statement. */
  revokeFamily(familyId: string): Promise<void>;
  /** Password change/reset (ADR 0017 §4) — revokes every session for that admin. */
  revokeAllForAdminUser(adminUserId: string): Promise<void>;
}
