import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Permission } from '../../domain/entities/permission.entity';
import type { PermissionRepository } from '../../domain/repositories/permission.repository';
import { PermissionMapper } from '../mappers/permission.mapper';

@Injectable()
export class PrismaPermissionRepository implements PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByKey(key: string): Promise<Permission | null> {
    const record = await this.prisma.permission.findUnique({ where: { key } });
    return record ? PermissionMapper.toDomain(record) : null;
  }

  async list(): Promise<Permission[]> {
    const records = await this.prisma.permission.findMany({ orderBy: { key: 'asc' } });
    return records.map(PermissionMapper.toDomain);
  }
}
