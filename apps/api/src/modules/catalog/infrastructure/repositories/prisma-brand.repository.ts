import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Brand } from '../../domain/entities/brand.entity';
import type { BrandRepository, CreateBrandData } from '../../domain/repositories/brand.repository';
import { BrandMapper } from '../mappers/brand.mapper';

@Injectable()
export class PrismaBrandRepository implements BrandRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBrandData): Promise<Brand> {
    const record = await this.prisma.brand.create({
      data: {
        storeId: data.storeId,
        name: data.name,
        slug: data.slug.toString(),
        description: data.description,
      },
    });
    return BrandMapper.toDomain(record);
  }

  async save(brand: Brand): Promise<void> {
    const props = brand.toProps();
    await this.prisma.brand.update({
      where: { id: props.id },
      data: {
        name: props.name,
        slug: props.slug.toString(),
        description: props.description,
      },
    });
  }

  async findById(storeId: string, id: string): Promise<Brand | null> {
    const record = await this.prisma.brand.findFirst({ where: { id, storeId } });
    return record ? BrandMapper.toDomain(record) : null;
  }

  async findBySlug(storeId: string, slug: string): Promise<Brand | null> {
    const record = await this.prisma.brand.findUnique({
      where: { storeId_slug: { storeId, slug } },
    });
    return record ? BrandMapper.toDomain(record) : null;
  }

  async list(storeId: string): Promise<Brand[]> {
    const records = await this.prisma.brand.findMany({ where: { storeId }, orderBy: { name: 'asc' } });
    return records.map(BrandMapper.toDomain);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.brand.deleteMany({ where: { id, storeId } });
  }
}
