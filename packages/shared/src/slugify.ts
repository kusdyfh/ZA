/**
 * Converts a string into a URL-safe slug. Used wherever a `slug` field
 * is derived from a `name` field (products, categories, pages...) per
 * docs/03-DATABASE-SCHEMA.md — the derivation itself is generic and
 * belongs here; the uniqueness check against the database does not.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
