import type { ListQueryDto } from './list-query.dto';

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface PaginateOptions<T> {
  /** Fields eligible for `?search=` — a plain, case-insensitive substring match. */
  searchableFields?: (keyof T & string)[];
  /** Fields eligible for `?sort=field:direction` — never the raw query string. */
  sortableFields?: (keyof T & string)[];
}

/**
 * Generic, in-memory pagination/sort/search applied to an already-fetched
 * list-use-case result — see docs/v2/adr/0016-api-layer-conventions.md §3
 * for why this lives here rather than in a repository. Every caller
 * passes its own explicit field allow-lists; an unlisted `sort`/`search`
 * field is silently ignored, never passed through to a comparator.
 */
export function paginate<T extends object>(
  items: T[],
  query: ListQueryDto,
  options: PaginateOptions<T> = {},
): PaginatedResult<T> {
  let result = items;

  if (query.search && options.searchableFields?.length) {
    const needle = query.search.toLowerCase();
    const fields = options.searchableFields;
    result = result.filter((item) =>
      fields.some((field) => {
        const value = (item as Record<string, unknown>)[field];
        return typeof value === 'string' && value.toLowerCase().includes(needle);
      }),
    );
  }

  if (query.sort && options.sortableFields?.length) {
    const allowed = new Set<string>(options.sortableFields);
    const clauses = query.sort
      .split(',')
      .map((clause) => {
        const [field, direction] = clause.split(':');
        return { field: field?.trim() ?? '', direction: direction?.trim() === 'desc' ? 'desc' : 'asc' };
      })
      .filter((clause) => allowed.has(clause.field));

    if (clauses.length > 0) {
      result = [...result].sort((a, b) => {
        for (const { field, direction } of clauses) {
          const comparison = compareValues(
            (a as Record<string, unknown>)[field],
            (b as Record<string, unknown>)[field],
          );
          if (comparison !== 0) {
            return direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const total = result.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    data: result.slice(start, start + limit),
    meta: { page, limit, total, totalPages },
  };
}

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return 0;
}
