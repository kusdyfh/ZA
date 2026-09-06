/** Shared shape for `page`/`limit`/`sort`/`search` query params, extendable per-resource so `buildQueryString` accepts it directly. */
export interface ListParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}
