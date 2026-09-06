import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AdminUser } from '../../domain/entities/admin-user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import type {
  AdminUserRepository,
  CreateAdminUserData,
} from '../../domain/repositories/admin-user.repository';
import { AdminUserMapper } from '../mappers/admin-user.mapper';

@Injectable()
export class PrismaAdminUserRepository implements AdminUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAdminUserData): Promise<AdminUser> {
    const record = await this.prisma.adminUser.create({
      data: {
        name: data.name,
        email: data.email.toString(),
        passwordHash: data.passwordHash,
        roleId: data.roleId,
        createdByActorId: data.actor.actorId,
        createdByActorType: data.actor.actorType,
        updatedByActorId: data.actor.actorId,
        updatedByActorType: data.actor.actorType,
      },
    });
    return AdminUserMapper.toDomain(record);
  }

  async findById(id: string): Promise<AdminUser | null> {
    const record = await this.prisma.adminUser.findUnique({ where: { id } });
    return record ? AdminUserMapper.toDomain(record) : null;
  }

  async findByEmail(email: Email): Promise<AdminUser | null> {
    const record = await this.prisma.adminUser.findUnique({
      where: { email: email.toString() },
    });
    return record ? AdminUserMapper.toDomain(record) : null;
  }

  async save(user: AdminUser): Promise<void> {
    const props = user.toProps();
    await this.prisma.adminUser.update({
      where: { id: props.id },
      data: {
        roleId: props.roleId,
        isActive: props.isActive,
        deactivatedAt: props.deactivatedAt,
        // Also written back on every save so ChangePasswordUseCase/
        // ResetPasswordUseCase (Epic 7) can persist a new hash via the
        // same entity round-trip; a no-op for every pre-existing caller
        // (activate/deactivate/changeRole), which never mutate it.
        passwordHash: props.passwordHash,
        updatedByActorId: props.updatedByActorId,
        updatedByActorType: props.updatedByActorType,
      },
    });
  }

  async countActiveByRoleId(roleId: string): Promise<number> {
    return this.prisma.adminUser.count({ where: { roleId, isActive: true } });
  }

  async list(): Promise<AdminUser[]> {
    const records = await this.prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } });
    return records.map(AdminUserMapper.toDomain);
  }
}
