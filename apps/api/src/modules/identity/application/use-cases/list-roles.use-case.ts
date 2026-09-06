import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '../../domain/entities/role.entity';
import { ROLE_REPOSITORY, type RoleRepository } from '../../domain/repositories/role.repository';

@Injectable()
export class ListRolesUseCase {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository) {}

  execute(): Promise<Role[]> {
    return this.roles.list();
  }
}
