import { InvalidEmailError } from '../errors/identity.errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalizes (trims + lowercases) and validates an email address at
 * construction time, so an invalid or differently-cased duplicate email
 * can never enter the domain layer. This is the application-level
 * equivalent of the Postgres `citext` recommendation in
 * docs/07-DATABASE-REVIEW.md §4 — same case-insensitive-uniqueness
 * intent, enforced here instead of via a database extension.
 */
export class Email {
  private constructor(private readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new InvalidEmailError(raw);
    }
    return new Email(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
