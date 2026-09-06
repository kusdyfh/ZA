import { Inject, Injectable } from '@nestjs/common';
import type { Permission } from '../../domain/entities/permission.entity';
import {
  PERMISSION_REPOSITORY,
  type PermissionRepository,
} from '../../domain/repositories/permission.repository';

@Injectable()
export class ListPermissionsUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: PermissionRepository,
  ) {}

  execute(): Promise<Permission[]> {
    return this.permissions.list();
  }
}
