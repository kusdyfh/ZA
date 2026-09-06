import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Tag } from '../../domain/entities/tag.entity';
import type { CreateTagData, TagRepository } from '../../domain/repositories/tag.repository';
import { TagMapper } from '../mappers/tag.mapper';

@Injectable()
export class PrismaTagRepository implements TagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTagData): Promise<Tag> {
    const record = await this.prisma.tag.create({
      data: {
        storeId: data.storeId,
        name: data.name,
        slug: data.slug.toString(),
      },
    });
    return TagMapper.toDomain(record);
  }

  async save(tag: Tag): Promise<void> {
    const props = tag.toProps();
    await this.prisma.tag.update({
      where: { id: props.id },
      data: {
        name: props.name,
        slug: props.slug.toString(),
      },
    });
  }

  async findById(storeId: string, id: string): Promise<Tag | null> {
    const record = await this.prisma.tag.findFirst({ where: { id, storeId } });
    return record ? TagMapper.toDomain(record) : null;
  }

  async findBySlug(storeId: string, slug: string): Promise<Tag | null> {
    const record = await this.prisma.tag.findUnique({ where: { storeId_slug: { storeId, slug } } });
    return record ? TagMapper.toDomain(record) : null;
  }

  async findManyByIds(storeId: string, ids: string[]): Promise<Tag[]> {
    const records = await this.prisma.tag.findMany({ where: { storeId, id: { in: ids } } });
    return records.map(TagMapper.toDomain);
  }

  async list(storeId: string): Promise<Tag[]> {
    const records = await this.prisma.tag.findMany({ where: { storeId }, orderBy: { name: 'asc' } });
    return records.map(TagMapper.toDomain);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.tag.deleteMany({ where: { id, storeId } });
  }
}
