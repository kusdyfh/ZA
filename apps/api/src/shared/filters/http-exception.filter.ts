import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import type { ApiErrorResponse, ApiErrorDetail } from '@za/types';
import { DomainError } from '../errors/domain-error';

/**
 * Maps every thrown error to the envelope specified by
 * docs/04-API-DESIGN.md §1: { success: false, error: { code, message,
 * details } }.
 *
 * Per docs/v2/adr/0016-api-layer-conventions.md §4: every `DomainError`
 * subclass across every module already carries a stable, SCREAMING_SNAKE_CASE
 * `code` — collectively already the "error code registry"
 * docs/08-API-REVIEW.md §7 asks be formalized. This filter uses that
 * `code` directly (no separate translation table to keep in sync) and
 * derives an HTTP status from the error's class name via a
 * convention-based classifier, not an exhaustive per-class lookup —
 * chosen specifically because new error classes are added by every
 * future epic and a name-pattern match needs no corresponding update.
 * Plain `HttpException`s (validation failures, this guard's 401s) keep
 * their own status/generic code exactly as before.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(HttpExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = this.resolveStatus(exception);
    const body = this.buildErrorBody(exception, status);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error({ err: exception }, 'Unhandled exception');
    } else {
      this.logger.warn({ err: exception }, 'Request failed');
    }

    response.status(status).json(body satisfies ApiErrorResponse);
  }

  private resolveStatus(exception: unknown): HttpStatus {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    if (exception instanceof DomainError) {
      return this.classifyDomainErrorStatus(exception);
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Convention-based, not an exhaustive per-class table — see this
   * file's doc comment and ADR 0016 §4.
   */
  private classifyDomainErrorStatus(exception: DomainError): HttpStatus {
    const name = exception.constructor.name;

    if (/NotFound/.test(name)) {
      return HttpStatus.NOT_FOUND;
    }
    if (
      /AlreadyInUse|AlreadyExists|Duplicate/.test(name) ||
      /IllegalOrderStatusTransition|ReservationNotConfirmable|ReservationNotReleasable|UnsupportedPaymentMethod|ItemUnavailableAtCheckout|UseCancelOrderUseCase/.test(
        name,
      )
    ) {
      return HttpStatus.CONFLICT;
    }
    // Epic 7 (Authentication & Authorization, ADR 0017) — PermissionDeniedError
    // existed since Epic 2 but had no HTTP mapping until this branch was
    // added; it was silently falling through to 400. InvalidCredentials/
    // InvalidRefreshToken/RefreshTokenReused/InvalidPasswordResetToken are
    // all "prove who you are again" failures, not permission failures.
    if (/PermissionDenied/.test(name)) {
      return HttpStatus.FORBIDDEN;
    }
    if (
      /InvalidCredentials|InvalidRefreshToken|RefreshTokenReused|InvalidPasswordResetToken/.test(
        name,
      )
    ) {
      return HttpStatus.UNAUTHORIZED;
    }
    return HttpStatus.BAD_REQUEST;
  }

  private buildErrorBody(exception: unknown, status: HttpStatus): ApiErrorResponse {
    if (exception instanceof DomainError) {
      return {
        success: false,
        error: {
          code: exception.code,
          message: exception.message,
        },
      };
    }

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      const details = this.extractValidationDetails(payload);

      return {
        success: false,
        error: {
          code: this.statusToCode(status),
          message: this.extractMessage(payload, exception.message),
          ...(details ? { details } : {}),
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong. Please try again.',
      },
    };
  }

  private extractMessage(payload: unknown, fallback: string): string {
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof payload.message === 'string'
    ) {
      return payload.message;
    }
    return fallback;
  }

  private extractValidationDetails(payload: unknown): ApiErrorDetail[] | undefined {
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      Array.isArray(payload.message)
    ) {
      const messages = payload.message as unknown[];
      return messages
        .filter((message): message is string => typeof message === 'string')
        .map((message) => ({
          field: message.split(' ')[0] ?? 'unknown',
          message,
        }));
    }
    return undefined;
  }

  private statusToCode(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_FAILED';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
