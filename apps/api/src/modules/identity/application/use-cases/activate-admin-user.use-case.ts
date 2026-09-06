import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import type { AdminUser } from '../../domain/entities/admin-user.entity';
import { AdminUserNotFoundError } from '../../domain/errors/identity.errors';
import {
  ADMIN_USER_REPOSITORY,
  type AdminUserRepository,
} from '../../domain/repositories/admin-user.repository';

export interface ActivateAdminUserInput {
  adminUserId: string;
  actor: ActorRef;
}

@Injectable()
export class ActivateAdminUserUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly adminUsers: AdminUserRepository,
  ) {}

  async execute(input: ActivateAdminUserInput): Promise<AdminUser> {
    const user = await this.adminUsers.findById(input.adminUserId);
    if (!user) {
      throw new AdminUserNotFoundError(input.adminUserId);
    }
    user.activate(input.actor);
    await this.adminUsers.save(user);
    return user;
  }
}
