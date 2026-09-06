import type { Permission } from '../../domain/entities/permission.entity';

export class PermissionResponseDto {
  id!: string;
  key!: string;
  module!: string;
  action!: string;

  static fromDomain(permission: Permission): PermissionResponseDto {
    const dto = new PermissionResponseDto();
    dto.id = permission.id;
    dto.key = permission.key;
    dto.module = permission.module;
    dto.action = permission.action;
    return dto;
  }
}
