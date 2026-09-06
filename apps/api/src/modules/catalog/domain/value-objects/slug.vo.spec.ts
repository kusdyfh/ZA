import { Slug } from './slug.vo';
import { InvalidSlugError } from '../errors/catalog.errors';

describe('Slug', () => {
  describe('fromName', () => {
    it('generates a URL-safe slug from a name', () => {
      expect(Slug.fromName('Classic V-Neck Scrub Top').toString()).toBe('classic-v-neck-scrub-top');
    });
  });

  describe('fromRaw', () => {
    it('accepts an already-valid slug, normalizing case/whitespace', () => {
      expect(Slug.fromRaw('  Some-Slug  ').toString()).toBe('some-slug');
    });

    it('rejects a value with spaces', () => {
      expect(() => Slug.fromRaw('not a slug')).toThrow(InvalidSlugError);
    });

    it('rejects a value with consecutive or trailing hyphens', () => {
      expect(() => Slug.fromRaw('bad--slug')).toThrow(InvalidSlugError);
      expect(() => Slug.fromRaw('bad-slug-')).toThrow(InvalidSlugError);
    });

    it('rejects an empty value', () => {
      expect(() => Slug.fromRaw('')).toThrow(InvalidSlugError);
    });
  });

  describe('equals', () => {
    it('treats two slugs with the same value as equal', () => {
      expect(Slug.fromRaw('same').equals(Slug.fromRaw('same'))).toBe(true);
    });

    it('treats different slugs as not equal', () => {
      expect(Slug.fromRaw('a').equals(Slug.fromRaw('b'))).toBe(false);
    });
  });
});
