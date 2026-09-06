import type { Role as RoleRecord } from '@prisma/client';
import { Role } from '../../domain/entities/role.entity';

export class RoleMapper {
  static toDomain(this: void, record: RoleRecord): Role {
    return Role.reconstitute({
      id: record.id,
      key: record.key,
      name: record.name,
      description: record.description,
      isSystem: record.isSystem,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
