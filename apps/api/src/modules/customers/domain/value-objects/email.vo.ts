import { InvalidEmailError } from '../errors/customer.errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A deliberate duplicate of Identity's Email VO, not a shared import —
 * per docs/v2/adr/0018 §1, Customer stays fully separate from Admin
 * Identity, including small generic value objects like this one.
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
