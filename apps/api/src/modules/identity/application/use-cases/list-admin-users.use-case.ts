import { Inject, Injectable } from '@nestjs/common';
import type { AdminUser } from '../../domain/entities/admin-user.entity';
import {
  ADMIN_USER_REPOSITORY,
  type AdminUserRepository,
} from '../../domain/repositories/admin-user.repository';

@Injectable()
export class ListAdminUsersUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly adminUsers: AdminUserRepository,
  ) {}

  execute(): Promise<AdminUser[]> {
    return this.adminUsers.list();
  }
}
