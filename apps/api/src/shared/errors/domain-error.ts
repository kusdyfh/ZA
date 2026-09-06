/**
 * Base class for every domain error across every module. Each concrete
 * error carries a stable `code`, matching the error-code-registry intent
 * from docs/v2/08-API-REVIEW.md §7 — HTTP mapping happens once a
 * controller layer exists (a later epic); for now these are caught and
 * asserted on directly in tests and application-layer code.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
