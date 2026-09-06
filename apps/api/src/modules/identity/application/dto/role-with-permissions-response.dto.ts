import type { RoleWithPermissionKeys } from '../../domain/repositories/role.repository';
import { RoleResponseDto } from './role-response.dto';

export class RoleWithPermissionsResponseDto {
  role!: RoleResponseDto;
  permissionKeys!: string[];

  static fromDomain(result: RoleWithPermissionKeys): RoleWithPermissionsResponseDto {
    const dto = new RoleWithPermissionsResponseDto();
    dto.role = RoleResponseDto.fromDomain(result.role);
    dto.permissionKeys = result.permissionKeys;
    return dto;
  }
}
