export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

/**
 * Port — the concrete algorithm (argon2id, per
 * docs/12-SECURITY-REVIEW.md §10) lives in the infrastructure layer.
 * Domain and application code depend only on this shape.
 */
export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>;
  verify(plainPassword: string, passwordHash: string): Promise<boolean>;
}
