import type {
  ApiErrorDetail,
  ApiResponse,
  ApiSuccessResponse,
  OffsetPaginationMeta,
} from '@za/types';
import {
  clearStoredAuth,
  getStoredAuth,
  setStoredAuth,
} from '../auth/token-storage';
import { API_BASE_URL } from '../config';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  /** Attach the stored customer access token, when one exists. Most storefront routes are @Public() and ignore it entirely. */
  auth?: boolean;
  body?: unknown;
}

/**
 * A single in-flight refresh, shared across concurrent 401s (ADR 0019
 * §1, mirrored here for customers per ADR 0022 §2) — avoids every
 * simultaneously-rejected request independently rotating the refresh
 * token (only one rotation is valid per ADR 0018's reuse detection).
 */
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const stored = getStoredAuth();
  if (!stored) {
    return null;
  }

  refreshInFlight ??= (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: stored.refreshToken }),
      });
      const body = (await response.json().catch(() => null)) as ApiResponse<{
        accessToken: string;
        refreshToken: string;
      }> | null;

      if (!response.ok || !body || !body.success) {
        clearStoredAuth();
        return null;
      }

      setStoredAuth({
        accessToken: body.data.accessToken,
        refreshToken: body.data.refreshToken,
        customer: stored.customer,
      });
      return body.data.accessToken;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function performFetch<T>(
  path: string,
  { auth = true, body, headers, ...rest }: ApiFetchOptions,
  accessToken: string | null,
): Promise<{ response: Response; body: ApiResponse<T> | null }> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // A 204 No Content (every DELETE, several actions) has no body to parse.
  const text = await response.text();
  let parsed: ApiResponse<T> | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as ApiResponse<T>;
    } catch {
      parsed = null;
    }
  }
  return { response, body: parsed };
}

/** Decodes the ADR 0016 envelope and returns the full success body (so callers needing `meta` can read it). */
async function request<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiSuccessResponse<T>> {
  const stored = getStoredAuth();
  let { response, body } = await performFetch<T>(
    path,
    options,
    stored?.accessToken ?? null,
  );

  if (
    response.status === 401 &&
    options.auth !== false &&
    stored?.refreshToken
  ) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      ({ response, body } = await performFetch<T>(
        path,
        options,
        newAccessToken,
      ));
    }
  }

  if (!body) {
    if (response.ok) {
      return { success: true, data: undefined as T };
    }
    throw new ApiError(
      'NETWORK_ERROR',
      'The server returned an unexpected response.',
      response.status,
    );
  }
  if (!body.success) {
    if (response.status === 401 && options.auth !== false) {
      clearStoredAuth();
    }
    throw new ApiError(
      body.error.code,
      body.error.message,
      response.status,
      body.error.details,
    );
  }
  return body;
}

export async function apiFetch<T>(
  path: string,
  options?: ApiFetchOptions,
): Promise<T> {
  const body = await request<T>(path, options);
  return body.data;
}

export async function apiFetchPaginated<T>(
  path: string,
  options?: ApiFetchOptions,
): Promise<{ data: T[]; meta: OffsetPaginationMeta }> {
  const body = await request<T[]>(path, options);
  return {
    data: body.data,
    meta: body.meta as unknown as OffsetPaginationMeta,
  };
}

export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}
