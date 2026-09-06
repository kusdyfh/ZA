import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Role } from '../../domain/entities/role.entity';
import type {
  RoleRepository,
  RoleWithPermissionKeys,
} from '../../domain/repositories/role.repository';
import { RoleMapper } from '../mappers/role.mapper';

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Role | null> {
    const record = await this.prisma.role.findUnique({ where: { id } });
    return record ? RoleMapper.toDomain(record) : null;
  }

  async findByKey(key: string): Promise<Role | null> {
    const record = await this.prisma.role.findUnique({ where: { key } });
    return record ? RoleMapper.toDomain(record) : null;
  }

  async list(): Promise<Role[]> {
    const records = await this.prisma.role.findMany({ orderBy: { name: 'asc' } });
    return records.map(RoleMapper.toDomain);
  }

  async findWithPermissions(id: string): Promise<RoleWithPermissionKeys | null> {
    const record = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    if (!record) {
      return null;
    }
    return {
      role: RoleMapper.toDomain(record),
      permissionKeys: record.permissions.map((grant) => grant.permission.key),
    };
  }
}
