import {
  InvalidAddressError,
  InvalidCustomerNameError,
  InvalidReviewError,
  WeakPasswordError,
} from '../errors/customer.errors';

export interface AddressInput {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  governorate: string;
  country: string;
}

/**
 * Every Customer business rule in one place — the epic's explicit
 * "keep all customer business rules centralized in CustomerPolicy" rule,
 * same discipline as every other module's central *Policy
 * (PasswordPolicy, ProductPolicy, InventoryPolicy, OrderPolicy, AuthPolicy).
 */
export class CustomerPolicy {
  /** Same length-over-complexity reasoning as staff's PasswordPolicy (docs/12-SECURITY-REVIEW.md §10). */
  static readonly PASSWORD_MIN_LENGTH = 10;

  static readonly REVIEW_BODY_MAX_LENGTH = 2000;

  /** Same TTL shape as staff auth (ADR 0017 §1) — a separate constant, not a shared import (ADR 0018 §1/§2). */
  static readonly ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
  static readonly REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

  static validateName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new InvalidCustomerNameError();
    }
    return trimmed;
  }

  static validatePassword(plainPassword: string): void {
    if (plainPassword.length < CustomerPolicy.PASSWORD_MIN_LENGTH) {
      throw new WeakPasswordError(
        `Password must be at least ${CustomerPolicy.PASSWORD_MIN_LENGTH} characters long.`,
      );
    }
  }

  /** Per docs/product/02-CUSTOMERS.md: line1/city/governorate/country required, phone in a standard format. */
  static assertValidAddress(input: AddressInput): void {
    if (!input.fullName.trim()) {
      throw new InvalidAddressError('Full name is required.');
    }
    if (!/^\+?[0-9][0-9\s-]{6,}$/.test(input.phone.trim())) {
      throw new InvalidAddressError('Phone must be a valid phone number.');
    }
    if (!input.line1.trim()) {
      throw new InvalidAddressError('Address line 1 is required.');
    }
    if (!input.city.trim()) {
      throw new InvalidAddressError('City is required.');
    }
    if (!input.governorate.trim()) {
      throw new InvalidAddressError('Governorate/region is required.');
    }
    if (!input.country.trim()) {
      throw new InvalidAddressError('Country is required.');
    }
  }

  /** Rating required 1-5; body optional but capped, per docs/product/13-REVIEWS.md. */
  static assertValidReview(rating: number, body: string | null | undefined): void {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new InvalidReviewError('Rating must be a whole number from 1 to 5.');
    }
    if (body && body.length > CustomerPolicy.REVIEW_BODY_MAX_LENGTH) {
      throw new InvalidReviewError(
        `Review text must be at most ${CustomerPolicy.REVIEW_BODY_MAX_LENGTH} characters.`,
      );
    }
  }
}
