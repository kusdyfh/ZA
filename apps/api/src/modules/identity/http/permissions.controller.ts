import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListPermissionsUseCase } from '../application/use-cases/list-permissions.use-case';
import { PermissionResponseDto } from '../application/dto/permission-response.dto';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../domain/constants/permissions.constants';

/** The full seeded permission catalog — docs/product/23-ROLES-PERMISSIONS.md. Read-only. */
@ApiTags('Identity — Permissions')
@ApiBearerAuth('access-token')
@RequirePermission(PERMISSION_KEYS.USERS_MANAGE)
@Controller('identity/permissions')
export class PermissionsController {
  constructor(private readonly listPermissions: ListPermissionsUseCase) {}

  @Get()
  @ApiOkResponse({ type: PermissionResponseDto, isArray: true })
  async list(): Promise<PermissionResponseDto[]> {
    const permissions = await this.listPermissions.execute();
    return permissions.map((permission) => PermissionResponseDto.fromDomain(permission));
  }
}
