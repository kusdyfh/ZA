import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, map } from 'rxjs';
import type { ApiSuccessResponse } from '@za/types';

interface PaginatedShape {
  data: unknown;
  meta: Record<string, unknown>;
}

function isPaginatedShape(value: unknown): value is PaginatedShape {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'meta' in value &&
    typeof (value as { meta: unknown }).meta === 'object'
  );
}

/**
 * Wraps every successful REST response in the envelope specified by
 * docs/04-API-DESIGN.md §1: { success: true, data, meta }. Health-check
 * routes are excluded — Terminus's own response shape is what uptime
 * tooling expects, per docs/v2/adr/0009-operational-architecture.md.
 *
 * List endpoints return `{ data, meta }` directly from the shared
 * `paginate()` helper (docs/v2/adr/0016-api-layer-conventions.md §3) —
 * that shape is spread into the envelope as-is (`data`/`meta` at the top
 * level) rather than double-nested under another `data` key.
 */
@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T> | T> {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.path.startsWith('/health')) {
      return next.handle();
    }

    return next.handle().pipe(
      map((result): ApiSuccessResponse<T> => {
        if (isPaginatedShape(result)) {
          return { success: true, data: result.data as T, meta: result.meta };
        }
        return { success: true, data: result };
      }),
    );
  }
}
