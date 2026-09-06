import type { AdminUser as AdminUserRecord } from '@prisma/client';
import type { ActorType } from '@za/types';
import { AdminUser } from '../../domain/entities/admin-user.entity';
import { Email } from '../../domain/value-objects/email.vo';

/**
 * Translates between the Prisma record and the domain entity. Prisma
 * generates its ActorType as a string-literal-union type (not a
 * nominal TS enum), so it isn't directly assignable to @za/types'
 * ActorType enum even though the underlying string values are
 * identical — hence the explicit cast here, confined to this one
 * infrastructure-layer boundary rather than leaking into the domain.
 */
export class AdminUserMapper {
  static toDomain(this: void, record: AdminUserRecord): AdminUser {
    return AdminUser.reconstitute({
      id: record.id,
      name: record.name,
      email: Email.create(record.email),
      passwordHash: record.passwordHash,
      roleId: record.roleId,
      isActive: record.isActive,
      deactivatedAt: record.deactivatedAt,
      createdByActorId: record.createdByActorId,
      createdByActorType: record.createdByActorType as ActorType,
      updatedByActorId: record.updatedByActorId,
      updatedByActorType: record.updatedByActorType as ActorType,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
