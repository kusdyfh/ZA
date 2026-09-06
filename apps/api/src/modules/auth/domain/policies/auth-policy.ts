/**
 * Every Authentication business rule/constant in one place — ADR 0017.
 * Deliberately pure (no HTTP/JWT-library/Prisma knowledge), same
 * discipline as Identity's PasswordPolicy and every other module's
 * central *Policy.
 */
export class AuthPolicy {
  /** Short-lived — re-verified against a live AdminUser every request. */
  static readonly ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

  /** Per ADR 0017 §1 — long enough to avoid re-login friction, rotated on every use. */
  static readonly REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

  /** Per docs/product/01-AUTHENTICATION.md's 30-minute reset-link window. */
  static readonly PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

  /**
   * Per docs/product/01-AUTHENTICATION.md's "5 failed attempts" rule —
   * realized as IP-based rate limiting (ADR 0017 §6), not per-account
   * lockout (no Notifications epic exists to send the alert email yet).
   */
  static readonly LOGIN_RATE_LIMIT = { limit: 5, ttlMs: 60_000 } as const;
}
