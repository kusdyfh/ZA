import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Size } from '../../domain/entities/size.entity';
import type { CreateSizeData, SizeRepository } from '../../domain/repositories/size.repository';
import { SizeMapper } from '../mappers/size.mapper';

@Injectable()
export class PrismaSizeRepository implements SizeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSizeData): Promise<Size> {
    const record = await this.prisma.size.create({
      data: { storeId: data.storeId, label: data.label, sortOrder: data.sortOrder },
    });
    return SizeMapper.toDomain(record);
  }

  async save(size: Size): Promise<void> {
    const props = size.toProps();
    await this.prisma.size.update({
      where: { id: props.id },
      data: { label: props.label, sortOrder: props.sortOrder },
    });
  }

  async findById(storeId: string, id: string): Promise<Size | null> {
    const record = await this.prisma.size.findFirst({ where: { id, storeId } });
    return record ? SizeMapper.toDomain(record) : null;
  }

  async findByLabel(storeId: string, label: string): Promise<Size | null> {
    const record = await this.prisma.size.findUnique({ where: { storeId_label: { storeId, label } } });
    return record ? SizeMapper.toDomain(record) : null;
  }

  async list(storeId: string): Promise<Size[]> {
    const records = await this.prisma.size.findMany({ where: { storeId }, orderBy: { sortOrder: 'asc' } });
    return records.map(SizeMapper.toDomain);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.size.deleteMany({ where: { id, storeId } });
  }
}
