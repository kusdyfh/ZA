import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import type { AdminUser } from '../../domain/entities/admin-user.entity';
import { AdminUserNotFoundError, LastSuperAdminError } from '../../domain/errors/identity.errors';
import {
  ADMIN_USER_REPOSITORY,
  type AdminUserRepository,
} from '../../domain/repositories/admin-user.repository';
import { ROLE_REPOSITORY, type RoleRepository } from '../../domain/repositories/role.repository';
import { ROLE_KEYS } from '../../domain/constants/roles.constants';

export interface DeactivateAdminUserInput {
  adminUserId: string;
  actor: ActorRef;
}

/**
 * Enforces the hard invariant from
 * docs/product/23-ROLES-PERMISSIONS.md: the platform can never be left
 * without at least one active Super Admin.
 */
@Injectable()
export class DeactivateAdminUserUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly adminUsers: AdminUserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
  ) {}

  async execute(input: DeactivateAdminUserInput): Promise<AdminUser> {
    const user = await this.adminUsers.findById(input.adminUserId);
    if (!user) {
      throw new AdminUserNotFoundError(input.adminUserId);
    }

    if (user.isActive) {
      await this.assertNotLastActiveSuperAdmin(user.roleId);
    }

    user.deactivate(input.actor);
    await this.adminUsers.save(user);
    return user;
  }

  private async assertNotLastActiveSuperAdmin(roleId: string): Promise<void> {
    const role = await this.roles.findById(roleId);
    if (!role || role.key !== ROLE_KEYS.SUPER_ADMIN) {
      return;
    }
    const activeSuperAdmins = await this.adminUsers.countActiveByRoleId(roleId);
    if (activeSuperAdmins <= 1) {
      throw new LastSuperAdminError('Cannot deactivate the last active Super Admin account.');
    }
  }
}
