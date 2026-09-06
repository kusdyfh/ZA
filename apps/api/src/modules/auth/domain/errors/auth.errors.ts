import { DomainError } from '../../../../shared/errors/domain-error';

/**
 * Deliberately the *only* error class for every login-failure reason
 * (unknown email, wrong password, inactive account) — per
 * docs/product/01-AUTHENTICATION.md's anti-enumeration rule ("never
 * reveals which was wrong"). The real reason is recorded internally in
 * `LoginHistory.failureReason`, never surfaced through this message.
 */
export class InvalidCredentialsError extends DomainError {
  readonly code = 'INVALID_CREDENTIALS';
  constructor() {
    super('Email or password is incorrect.');
  }
}

export class InvalidRefreshTokenError extends DomainError {
  readonly code = 'INVALID_REFRESH_TOKEN';
  constructor() {
    super('This session is no longer valid. Please log in again.');
  }
}

/**
 * Per ADR 0017 §2 — a refresh token already marked used was presented
 * again, a strong signal of a stolen/replayed token. The entire token
 * family is revoked before this is thrown.
 */
export class RefreshTokenReusedError extends DomainError {
  readonly code = 'REFRESH_TOKEN_REUSED';
  constructor() {
    super('This session was revoked for security reasons. Please log in again.');
  }
}

/**
 * Covers not-found, expired, and already-used reset tokens under one
 * generic message — same anti-enumeration reasoning as
 * InvalidCredentialsError.
 */
export class InvalidPasswordResetTokenError extends DomainError {
  readonly code = 'INVALID_PASSWORD_RESET_TOKEN';
  constructor() {
    super('This reset link is invalid or has expired.');
  }
}

export class SessionNotFoundError extends DomainError {
  readonly code = 'SESSION_NOT_FOUND';
  constructor(id: string) {
    super(`Session "${id}" was not found.`);
  }
}
