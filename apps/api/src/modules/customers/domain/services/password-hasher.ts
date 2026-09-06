export const CUSTOMER_PASSWORD_HASHER = Symbol('CUSTOMER_PASSWORD_HASHER');

/**
 * A Customer-owned port, deliberately not a shared import from Identity
 * (ADR 0018 §1) — the concrete implementation reuses the same generic
 * Argon2 wrapper class, but bound to this module's own DI token.
 */
export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>;
  verify(plainPassword: string, passwordHash: string): Promise<boolean>;
}
