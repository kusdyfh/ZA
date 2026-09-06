import { Injectable } from '@nestjs/common';
import { PermissionDeniedError } from '../errors/identity.errors';
import type { RoleWithPermissionKeys } from '../repositories/role.repository';

/**
 * The RBAC decision logic ("Authorization Policies"). Deliberately pure
 * — it operates on already-loaded role/permission data and has no
 * knowledge of HTTP, JWT, or "the current request." Wiring this into a
 * NestJS guard that extracts the current actor from a request is the
 * job of whichever epic adds authentication (Login/JWT/Sessions), per
 * this epic's explicit exclusions — that guard will call this service,
 * not reimplement it.
 */
@Injectable()
export class AuthorizationService {
  hasPermission(role: RoleWithPermissionKeys, permissionKey: string): boolean {
    return role.permissionKeys.includes(permissionKey);
  }

  hasAnyPermission(role: RoleWithPermissionKeys, permissionKeys: string[]): boolean {
    return permissionKeys.some((key) => this.hasPermission(role, key));
  }

  hasAllPermissions(role: RoleWithPermissionKeys, permissionKeys: string[]): boolean {
    return permissionKeys.every((key) => this.hasPermission(role, key));
  }

  /** Throws PermissionDeniedError rather than returning a boolean. */
  assertPermission(role: RoleWithPermissionKeys, permissionKey: string): void {
    if (!this.hasPermission(role, permissionKey)) {
      throw new PermissionDeniedError(permissionKey);
    }
  }
}
