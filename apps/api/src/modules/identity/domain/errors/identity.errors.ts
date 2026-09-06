import { DomainError } from '../../../../shared/errors/domain-error';

export class InvalidEmailError extends DomainError {
  readonly code = 'INVALID_EMAIL';
  constructor(value: string) {
    super(`"${value}" is not a valid email address.`);
  }
}

export class InvalidAdminUserNameError extends DomainError {
  readonly code = 'INVALID_ADMIN_USER_NAME';
  constructor() {
    super('Name must not be empty.');
  }
}

/**
 * Per docs/product/01-AUTHENTICATION.md: length over complexity rules.
 */
export class WeakPasswordError extends DomainError {
  readonly code = 'WEAK_PASSWORD';
  constructor(message: string) {
    super(message);
  }
}

export class EmailAlreadyInUseError extends DomainError {
  readonly code = 'EMAIL_ALREADY_IN_USE';
  constructor(email: string) {
    super(`An account with the email "${email}" already exists.`);
  }
}

export class AdminUserNotFoundError extends DomainError {
  readonly code = 'ADMIN_USER_NOT_FOUND';
  constructor(id: string) {
    super(`Admin user "${id}" was not found.`);
  }
}

export class RoleNotFoundError extends DomainError {
  readonly code = 'ROLE_NOT_FOUND';
  constructor(idOrKey: string) {
    super(`Role "${idOrKey}" was not found.`);
  }
}

export class PermissionNotFoundError extends DomainError {
  readonly code = 'PERMISSION_NOT_FOUND';
  constructor(idOrKey: string) {
    super(`Permission "${idOrKey}" was not found.`);
  }
}

/**
 * Enforces the hard invariant from
 * docs/product/23-ROLES-PERMISSIONS.md / docs/12-SECURITY-REVIEW.md §7:
 * the platform can never be left without at least one active Super
 * Admin.
 */
export class LastSuperAdminError extends DomainError {
  readonly code = 'LAST_SUPER_ADMIN';
  constructor(message: string) {
    super(message);
  }
}

export class PermissionDeniedError extends DomainError {
  readonly code = 'PERMISSION_DENIED';
  constructor(permissionKey: string) {
    super(`Missing required permission "${permissionKey}".`);
  }
}
