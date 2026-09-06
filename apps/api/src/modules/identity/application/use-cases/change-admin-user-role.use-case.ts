import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import type { AdminUser } from '../../domain/entities/admin-user.entity';
import {
  AdminUserNotFoundError,
  LastSuperAdminError,
  RoleNotFoundError,
} from '../../domain/errors/identity.errors';
import {
  ADMIN_USER_REPOSITORY,
  type AdminUserRepository,
} from '../../domain/repositories/admin-user.repository';
import { ROLE_REPOSITORY, type RoleRepository } from '../../domain/repositories/role.repository';
import { ROLE_KEYS } from '../../domain/constants/roles.constants';

export interface ChangeAdminUserRoleInput {
  adminUserId: string;
  newRoleId: string;
  actor: ActorRef;
}

/**
 * Same invariant as DeactivateAdminUserUseCase, applied to the "moved
 * out of the Super Admin role" case rather than deactivation.
 */
@Injectable()
export class ChangeAdminUserRoleUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly adminUsers: AdminUserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
  ) {}

  async execute(input: ChangeAdminUserRoleInput): Promise<AdminUser> {
    const user = await this.adminUsers.findById(input.adminUserId);
    if (!user) {
      throw new AdminUserNotFoundError(input.adminUserId);
    }

    const newRole = await this.roles.findById(input.newRoleId);
    if (!newRole) {
      throw new RoleNotFoundError(input.newRoleId);
    }

    if (user.isActive && user.roleId !== newRole.id) {
      await this.assertNotLastActiveSuperAdminMovingAway(user.roleId);
    }

    user.changeRole(newRole.id, input.actor);
    await this.adminUsers.save(user);
    return user;
  }

  private async assertNotLastActiveSuperAdminMovingAway(currentRoleId: string): Promise<void> {
    const currentRole = await this.roles.findById(currentRoleId);
    if (!currentRole || currentRole.key !== ROLE_KEYS.SUPER_ADMIN) {
      return;
    }
    const activeSuperAdmins = await this.adminUsers.countActiveByRoleId(currentRoleId);
    if (activeSuperAdmins <= 1) {
      throw new LastSuperAdminError(
        'Cannot move the last active Super Admin out of the Super Admin role.',
      );
    }
  }
}
