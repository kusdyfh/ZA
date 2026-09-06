import type { ActorRef } from '@za/types';
import type { AdminUser } from '../entities/admin-user.entity';
import type { Email } from '../value-objects/email.vo';

export const ADMIN_USER_REPOSITORY = Symbol('ADMIN_USER_REPOSITORY');

export interface CreateAdminUserData {
  name: string;
  email: Email;
  passwordHash: string;
  roleId: string;
  actor: ActorRef;
}

/**
 * Port for AdminUser persistence. `create` returns the fully-hydrated
 * entity (id/createdAt/updatedAt only exist once Postgres has assigned
 * them) — see the note on AdminUser's constructor for why there's no
 * public "new AdminUser(...)".
 */
export interface AdminUserRepository {
  create(data: CreateAdminUserData): Promise<AdminUser>;
  findById(id: string): Promise<AdminUser | null>;
  findByEmail(email: Email): Promise<AdminUser | null>;
  /** Persists mutations made via deactivate()/activate()/changeRole(). */
  save(user: AdminUser): Promise<void>;
  /** Used by the "last Super Admin" invariant check. */
  countActiveByRoleId(roleId: string): Promise<number>;
  list(): Promise<AdminUser[]>;
}
