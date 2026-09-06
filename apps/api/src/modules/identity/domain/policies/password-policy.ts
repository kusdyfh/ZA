import { WeakPasswordError } from '../errors/identity.errors';

/**
 * Per docs/product/01-AUTHENTICATION.md and docs/12-SECURITY-REVIEW.md
 * §10: length is prioritized over forced complexity rules. A breach
 * check (HaveIBeenPwned k-anonymity, noted as "recommended" in
 * docs/12-SECURITY-REVIEW.md) is deliberately not implemented here — it
 * requires an external network call, which doesn't belong in a pure,
 * offline-testable domain policy; it belongs in the application layer
 * of whichever epic actually wires up registration/password-change.
 */
export const PASSWORD_MIN_LENGTH = 10;

export class PasswordPolicy {
  static validate(plainPassword: string): void {
    if (plainPassword.length < PASSWORD_MIN_LENGTH) {
      throw new WeakPasswordError(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
      );
    }
  }
}
