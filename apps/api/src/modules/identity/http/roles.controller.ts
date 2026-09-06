import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListRolesUseCase } from '../application/use-cases/list-roles.use-case';
import { GetRoleWithPermissionsUseCase } from '../application/use-cases/get-role-with-permissions.use-case';
import { RoleResponseDto } from '../application/dto/role-response.dto';
import { RoleWithPermissionsResponseDto } from '../application/dto/role-with-permissions-response.dto';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../domain/constants/permissions.constants';

/** RBAC reference data — docs/product/23-ROLES-PERMISSIONS.md. Read-only; roles are fixed and seeded. */
@ApiTags('Identity — Roles')
@ApiBearerAuth('access-token')
@RequirePermission(PERMISSION_KEYS.USERS_MANAGE)
@Controller('identity/roles')
export class RolesController {
  constructor(
    private readonly listRoles: ListRolesUseCase,
    private readonly getRoleWithPermissions: GetRoleWithPermissionsUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ type: RoleResponseDto, isArray: true })
  async list(): Promise<RoleResponseDto[]> {
    const roles = await this.listRoles.execute();
    return roles.map((role) => RoleResponseDto.fromDomain(role));
  }

  @Get(':id/permissions')
  @ApiOkResponse({ type: RoleWithPermissionsResponseDto })
  async getWithPermissions(@Param('id') id: string): Promise<RoleWithPermissionsResponseDto> {
    const result = await this.getRoleWithPermissions.execute({ roleId: id });
    return RoleWithPermissionsResponseDto.fromDomain(result);
  }
}
