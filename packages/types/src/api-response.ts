/**
 * The response envelope shape, as specified in
 * docs/04-API-DESIGN.md §1 and refined in docs/v2/08-API-REVIEW.md §7
 * (the error-code registry). Every apps/api endpoint responds in this
 * shape; both frontends decode against it.
 */

export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
  meta?: Record<string, unknown>;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  /** Stable, machine-readable code — see the error-code registry. */
  code: string;
  /** Safe to show directly to the end user. */
  message: string;
  /** Present only for validation errors (field-level messages). */
  details?: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

export function isApiSuccess<TData>(
  response: ApiResponse<TData>,
): response is ApiSuccessResponse<TData> {
  return response.success === true;
}
