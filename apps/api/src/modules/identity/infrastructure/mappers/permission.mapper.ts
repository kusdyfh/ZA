import type { Permission as PermissionRecord } from '@prisma/client';
import { Permission } from '../../domain/entities/permission.entity';

export class PermissionMapper {
  static toDomain(this: void, record: PermissionRecord): Permission {
    return Permission.reconstitute({
      id: record.id,
      key: record.key,
      module: record.module,
      action: record.action,
      description: record.description,
      createdAt: record.createdAt,
    });
  }
}
