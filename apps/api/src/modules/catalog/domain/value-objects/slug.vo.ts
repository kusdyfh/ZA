import { slugify } from '@za/shared';
import { InvalidSlugError } from '../errors/catalog.errors';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Docs/06-DDD-BOUNDED-CONTEXTS.md calls this domain service
 * "SlugGenerator"; the epic brief names it "Slug Service" — same
 * concept, named to match the brief. Generation (`fromName`) always
 * produces a valid slug via `@za/shared`'s `slugify()`; an
 * explicitly-provided slug (`fromRaw`) is strictly validated, never
 * silently reformatted, so a malformed manual entry surfaces as a clear
 * validation error rather than a surprising auto-correction.
 */
export class Slug {
  private constructor(private readonly value: string) {}

  static fromName(name: string): Slug {
    return new Slug(slugify(name));
  }

  static fromRaw(raw: string): Slug {
    const normalized = raw.trim().toLowerCase();
    if (!SLUG_PATTERN.test(normalized)) {
      throw new InvalidSlugError(raw);
    }
    return new Slug(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Slug): boolean {
    return this.value === other.value;
  }
}
