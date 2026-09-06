import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Color } from '../../domain/entities/color.entity';
import type { ColorRepository, CreateColorData } from '../../domain/repositories/color.repository';
import { ColorMapper } from '../mappers/color.mapper';

@Injectable()
export class PrismaColorRepository implements ColorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateColorData): Promise<Color> {
    const record = await this.prisma.color.create({
      data: { storeId: data.storeId, name: data.name, hexCode: data.hexCode },
    });
    return ColorMapper.toDomain(record);
  }

  async save(color: Color): Promise<void> {
    const props = color.toProps();
    await this.prisma.color.update({
      where: { id: props.id },
      data: { name: props.name, hexCode: props.hexCode },
    });
  }

  async findById(storeId: string, id: string): Promise<Color | null> {
    const record = await this.prisma.color.findFirst({ where: { id, storeId } });
    return record ? ColorMapper.toDomain(record) : null;
  }

  async findByName(storeId: string, name: string): Promise<Color | null> {
    const record = await this.prisma.color.findUnique({ where: { storeId_name: { storeId, name } } });
    return record ? ColorMapper.toDomain(record) : null;
  }

  async list(storeId: string): Promise<Color[]> {
    const records = await this.prisma.color.findMany({ where: { storeId }, orderBy: { name: 'asc' } });
    return records.map(ColorMapper.toDomain);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.color.deleteMany({ where: { id, storeId } });
  }
}
