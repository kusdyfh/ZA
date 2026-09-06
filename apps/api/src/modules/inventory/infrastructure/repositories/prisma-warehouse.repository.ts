import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Warehouse } from '../../domain/entities/warehouse.entity';
import type { CreateWarehouseData, WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import { WarehouseMapper } from '../mappers/warehouse.mapper';

@Injectable()
export class PrismaWarehouseRepository implements WarehouseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateWarehouseData): Promise<Warehouse> {
    const record = await this.prisma.warehouse.create({
      data: { storeId: data.storeId, name: data.name, code: data.code, isDefault: data.isDefault },
    });
    return WarehouseMapper.toDomain(record);
  }

  async save(warehouse: Warehouse): Promise<void> {
    const props = warehouse.toProps();
    await this.prisma.warehouse.update({
      where: { id: props.id },
      data: { name: props.name, code: props.code },
    });
  }

  async findById(storeId: string, id: string): Promise<Warehouse | null> {
    const record = await this.prisma.warehouse.findFirst({ where: { id, storeId } });
    return record ? WarehouseMapper.toDomain(record) : null;
  }

  async findByCode(storeId: string, code: string): Promise<Warehouse | null> {
    const record = await this.prisma.warehouse.findUnique({ where: { storeId_code: { storeId, code } } });
    return record ? WarehouseMapper.toDomain(record) : null;
  }

  async findDefault(storeId: string): Promise<Warehouse | null> {
    const record = await this.prisma.warehouse.findFirst({ where: { storeId, isDefault: true } });
    return record ? WarehouseMapper.toDomain(record) : null;
  }

  async list(storeId: string): Promise<Warehouse[]> {
    const records = await this.prisma.warehouse.findMany({ where: { storeId }, orderBy: { name: 'asc' } });
    return records.map(WarehouseMapper.toDomain);
  }
}
