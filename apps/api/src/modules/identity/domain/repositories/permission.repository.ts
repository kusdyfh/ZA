import type { Permission } from '../entities/permission.entity';

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');

export interface PermissionRepository {
  findByKey(key: string): Promise<Permission | null>;
  list(): Promise<Permission[]>;
}
