import { Inject, Injectable } from '@nestjs/common';
import { RoleNotFoundError } from '../../domain/errors/identity.errors';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
  type RoleWithPermissionKeys,
} from '../../domain/repositories/role.repository';

export interface GetRoleWithPermissionsInput {
  roleId: string;
}

@Injectable()
export class GetRoleWithPermissionsUseCase {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository) {}

  async execute(input: GetRoleWithPermissionsInput): Promise<RoleWithPermissionKeys> {
    const result = await this.roles.findWithPermissions(input.roleId);
    if (!result) {
      throw new RoleNotFoundError(input.roleId);
    }
    return result;
  }
}
