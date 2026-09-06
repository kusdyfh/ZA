/**
 * Pagination shapes, as specified in docs/04-API-DESIGN.md §1 (offset
 * pagination, the default) and docs/v2/08-API-REVIEW.md §5 (cursor
 * pagination for high-volume admin tables such as orders and the audit
 * log).
 */

export interface OffsetPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OffsetPaginatedResponse<TItem> {
  success: true;
  data: TItem[];
  meta: OffsetPaginationMeta;
}

export interface CursorPaginationMeta {
  nextCursor: string | null;
}

export interface CursorPaginatedResponse<TItem> {
  success: true;
  data: TItem[];
  meta: CursorPaginationMeta;
}
