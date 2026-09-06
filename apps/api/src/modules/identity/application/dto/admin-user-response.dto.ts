import type { AdminUser } from '../../domain/entities/admin-user.entity';

/**
 * Never carries passwordHash — this is the shape any future controller
 * layer would actually serialize.
 */
export class AdminUserResponseDto {
  id!: string;
  name!: string;
  email!: string;
  roleId!: string;
  isActive!: boolean;
  deactivatedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromDomain(user: AdminUser): AdminUserResponseDto {
    const props = user.toProps();
    const dto = new AdminUserResponseDto();
    dto.id = props.id;
    dto.name = props.name;
    dto.email = props.email.toString();
    dto.roleId = props.roleId;
    dto.isActive = props.isActive;
    dto.deactivatedAt = props.deactivatedAt;
    dto.createdAt = props.createdAt;
    dto.updatedAt = props.updatedAt;
    return dto;
  }
}
