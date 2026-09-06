import type { Role } from '../../domain/entities/role.entity';

export class RoleResponseDto {
  id!: string;
  key!: string;
  name!: string;
  description!: string | null;
  isSystem!: boolean;

  static fromDomain(role: Role): RoleResponseDto {
    const dto = new RoleResponseDto();
    dto.id = role.id;
    dto.key = role.key;
    dto.name = role.name;
    dto.description = role.description;
    dto.isSystem = role.isSystem;
    return dto;
  }
}
