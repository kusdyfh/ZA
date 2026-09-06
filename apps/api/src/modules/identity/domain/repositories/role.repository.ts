import type { Role } from '../entities/role.entity';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface RoleWithPermissionKeys {
  role: Role;
  permissionKeys: string[];
}

export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findByKey(key: string): Promise<Role | null>;
  list(): Promise<Role[]>;
  /** Loads a role together with the keys of every permission it's been granted. */
  findWithPermissions(id: string): Promise<RoleWithPermissionKeys | null>;
}
