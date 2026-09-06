import { Inject, Injectable } from '@nestjs/common';
import {
  ADMIN_USER_REPOSITORY,
  type AdminUserRepository,
} from '../../domain/repositories/admin-user.repository';
import { ROLE_REPOSITORY, type RoleRepository } from '../../domain/repositories/role.repository';
import { AuthorizationService } from '../../domain/services/authorization.service';

export interface CheckPermissionInput {
  adminUserId: string;
  permissionKey: string;
}

/**
 * The use-case a future NestJS guard will call once Login/JWT exist —
 * resolves "does this admin user, right now, have this permission" from
 * raw IDs, wrapping the pure AuthorizationService with the repository
 * lookups it needs.
 */
@Injectable()
export class CheckPermissionUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly adminUsers: AdminUserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    private readonly authorization: AuthorizationService,
  ) {}

  async execute(input: CheckPermissionInput): Promise<boolean> {
    const user = await this.adminUsers.findById(input.adminUserId);
    if (!user || !user.isActive) {
      return false;
    }

    const roleWithPermissions = await this.roles.findWithPermissions(user.roleId);
    if (!roleWithPermissions) {
      return false;
    }

    return this.authorization.hasPermission(roleWithPermissions, input.permissionKey);
  }
}
